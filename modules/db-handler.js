import lpcsvUtil from "../modules/map-lpcsv-to-apparr.js";

import { deepFreeze } from "./utils.js";
import { APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, SUBJECTS, GRADE_LEVELS, Application } from "../public/application.js";
import sqlite3 from "sqlite3";
import { v4 as genUUID } from "uuid";
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(":memory:");

var allAppsCache = undefined;

const APP_TABLE = {
    NAME:"applications",
    COLS:[
        {name:"id", type:"TEXT", primaryKey:true, default: "random()"},
        {name:"name", type:"TEXT", notNull:true},
        {name:"url", type:"TEXT"},
        {name:"approvalStatus", type:"INT", enum:APPROVAL_STATUSES, notNull:true, default: 0},
        {name:"privacyStatus", type:"INT", enum:PRIVACY_STATUSES, notNull:true, default: 0},
        {name:"platforms", type:"TEXT", arrEnum:PLATFORMS, notNull:true, default: ""},
        {name:"gradeLevels", type:"TEXT", arrEnum:GRADE_LEVELS, notNull:true, default: ""},
        {name:"subjects", type:"TEXT", arrEnum:SUBJECTS, notNull:true, default: ""}
    ]
};
const ADMIN_USER_TABLE = {
    NAME:"adminUsers",
    COLS:[
        {name:"id", type:"TEXT", notNull:true, default: "random()"},
        {name:"username", type:"TEXT", primaryKey:true},
        {name:"hashedpass", type:"TEXT", notNull:true}
    ]
};
deepFreeze([APP_TABLE,ADMIN_USER_TABLE]);


function asyncCMD(cmd,query,params) {
    if (/^(UPDATE|INSERT|DELETE)/i.test(query)) {
        if (new RegExp(APP_TABLE.NAME).test(query)) allAppsCache = undefined;
    }
    return new Promise((res,rej)=>{
        db[cmd](query,params,(err,data)=>{
            if (err) rej(err);
            else res(data);
        })
    });
}

function tableColsStr(cols) {
    var slst = [];
    for (var col of cols) {
        var clst = typeof(col.type)=="string"?[col.name,col.type]:[col.name,"TEXT"];
        if (col.enum) clst.push("CHECK("+col.name+" >= 0 AND "+col.name+" < "+col.enum.length+")")
        if (col.notNull) clst.push("NOT NULL");
        if (col.primaryKey) clst.push("PRIMARY KEY");
        if (col.unique) clst.push("UNIQUE");
        if (col.default) clst.push("DEFAULT("+col.default+")");
        slst.push(clst.join(" "));
    }
    return `(${slst.join(", ")})`;
}

function getAppValidKVPairs(/**@type {Application}*/app) {
    var keys = [], values = [], appjson = app.toJSON(); const allowedKeys = ["name","url","approvalStatus","privacyStatus","platforms","subjects","gradeLevels"];
    for (var key in appjson) if (allowedKeys.includes(key)) {
        keys.push(key);
        values.push(appjson[key]);
    }
    return {keys,values};
}
async function updateApp(/**@type {string}*/appId,/**@type {Application}*/app) {
    var {keys,values} = getAppValidKVPairs(app);
    values.push(appId);
    await asyncCMD("run","UPDATE "+APP_TABLE.NAME+" SET "+keys.map(s=>`${s}=?`).join(",")+" WHERE id=?",values);
    return;
}
async function addApp(/**@type {Application}*/app) {
    var {keys,values} = getAppValidKVPairs(app);
    var id = genUUID();
    keys.push("id"); values.push(id);
    await asyncCMD("run","INSERT INTO "+APP_TABLE.NAME+" ("+keys.join(",")+") VALUES ("+new Array(keys.length).fill("?").join(",")+")",values);
    return id;
}
async function getApp(appId) {
    var v = await asyncCMD("get","SELECT * FROM "+APP_TABLE.NAME+" WHERE id=?",[appId]);
    return v?Application.parse(v):null;
}
async function delApp(appId) {
    await asyncCMD("run","DELETE FROM "+APP_TABLE.NAME+" WHERE id=?",[appId]); return;
}
async function searchApps(searchQuery) {
    var {name,approvalStatus,privacyStatus,platforms,platformsRequireAll,gradeLevels,gradeLevelsRequireAll,subjects,subjectsRequireAll} = searchQuery;
    var queryParams = [];
    var query = "SELECT * FROM "+APP_TABLE.NAME;
    var n = 0;
    var append = (qstr,qprm)=>{
        if (n++ == 0) query += " WHERE "+qstr;
        else query += " AND "+qstr;
        if (qprm) queryParams.push(qprm);
    };
    var appendArr = (pname,arr,reqAll)=>append(`(SELECT COUNT(*) FROM (
        WITH split(word, str) AS (
            SELECT '', ${pname}||','
            UNION ALL SELECT
            substr(str, 0, instr(str, ',')),
            substr(str, instr(str, ',')+1)
            FROM split WHERE str!=''
        ) SELECT word FROM split WHERE word!='') WHERE word in ('${arr.join("','")}')) `+(reqAll?`== ${arr.length}`:"> 0")
    );
    
    if (name) append("name LIKE ?",`%${name}%`)
    if (platforms && platforms.length && platforms.every(v=>Number.isSafeInteger(v)))
        appendArr("platforms",platforms,platformsRequireAll);
    if (gradeLevels && gradeLevels.length && gradeLevels.every(v=>Number.isSafeInteger(v)))
        appendArr("gradeLevels",gradeLevels,gradeLevelsRequireAll);
    if (subjects && subjects.length && subjects.every(v=>Number.isSafeInteger(v)))
        appendArr("subjects",subjects,subjectsRequireAll);
    if (approvalStatus && approvalStatus.length && approvalStatus.every(v=>Number.isSafeInteger(v))) 
        append(`approvalStatus in ('${approvalStatus.join("','")}')`);
    if (privacyStatus && privacyStatus.length && privacyStatus.every(v=>Number.isSafeInteger(v))) 
        append(`privacyStatus in ('${privacyStatus.join("','")}')`);
    query += " ORDER BY name COLLATE NOCASE ASC";

    return (await asyncCMD("all",query,queryParams)).map(v=>Application.parse(v));
}
async function allApps() {
    if (allAppsCache) return allAppsCache.map(v=>Application.parse(v));
    else return (allAppsCache = await asyncCMD("all",`SELECT * FROM ${APP_TABLE.NAME} ORDER BY name COLLATE NOCASE ASC`)).map(v=>Application.parse(v));
}


async function getAdminByUsername(username) {
    return await asyncCMD("get",`SELECT * FROM ${ADMIN_USER_TABLE.NAME} WHERE username=?`,[username]);
}
async function createAdminAccount(username,hashedpass) {
    var id = genUUID();
    await asyncCMD("run",`INSERT INTO ${ADMIN_USER_TABLE.NAME} (id,username,hashedpass) VALUES (?,?,?)`,[id,username,hashedpass]);
    return id;
}
async function adminsExist() {
    return !!await asyncCMD("get",`SELECT id FROM ${ADMIN_USER_TABLE.NAME}`);
}


async function tryInitDB() {
    await Promise.all([
        asyncCMD("run","CREATE TABLE IF NOT EXISTS "+APP_TABLE.NAME+" "+tableColsStr(APP_TABLE.COLS),[]),
        asyncCMD("run","CREATE TABLE IF NOT EXISTS "+ADMIN_USER_TABLE.NAME+" "+tableColsStr(ADMIN_USER_TABLE.COLS),[])
    ]);
}


(async()=>{
    await tryInitDB();
    
    var promises = [];
    for (var k of lpcsvUtil.convertLPCSV(lpcsvUtil.getLPCSV_test())) {
        for (var i = 0; Math.random()>0.3; i++) k.addPlatform(PLATFORMS[Math.floor(Math.random()*PLATFORMS.length)]);
        for (var i = 0; Math.random()>0.3; i++) k.addSubject(SUBJECTS[Math.floor(Math.random()*SUBJECTS.length)]);
        for (var i = 0; Math.random()>0.3; i++) k.addGradeLevel(GRADE_LEVELS[Math.floor(Math.random()*GRADE_LEVELS.length)]);
        promises.push(addApp(k));
    }
    await Promise.all(promises);

})();

export default {
    sql: asyncCMD, 
    apps: {
        search:searchApps,
        get:getApp,
        getAll:allApps,
        add:addApp,
        del:delApp,
        update:updateApp
    },
    admin: {
        getByUsername: getAdminByUsername,
        add: createAdminAccount,
        anyExists: adminsExist
    }
}