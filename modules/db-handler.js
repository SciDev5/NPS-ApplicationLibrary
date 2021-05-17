import lpcsvUtil from "../modules/map-lpcsv-to-apparr.js";

import { deepFreeze } from "./utils.js";
import { APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, SUBJECTS, GRADE_LEVELS, Application } from "../public/application.js";
//import pg from "pg";
import { v4 as genUUID } from "uuid";
import {Sequelize} from "sequelize";
var client = new Sequelize(process.env.DATABASE_URL, {dialectOptions:{ssl:{require:true, rejectUnauthorized: false}},dialect:"sqlite"});

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
    await client.query({query:"UPDATE "+APP_TABLE.NAME+" SET "+keys.map(s=>`${s}=?`).join(",")+" WHERE id=?",values});
    return;
}
async function addApp(/**@type {Application}*/app) {
    var {keys,values} = getAppValidKVPairs(app);
    var id = genUUID();
    keys.push("id"); values.push(id);
    await client.query({query:"INSERT INTO "+APP_TABLE.NAME+" ("+keys.join(",")+") VALUES ("+new Array(keys.length).fill("?").join(",")+")",values});
    return id;
}
async function getApp(appId) {
    var v = (await client.query({query:"SELECT * FROM "+APP_TABLE.NAME+" WHERE id=? LIMIT 1",values:[appId]}))[0];
    return v?Application.parse(v):null;
}
async function delApp(appId) {
    await client.query({query:"DELETE FROM "+APP_TABLE.NAME+" WHERE id=?",values:[appId]}); return;
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

    return (await client.query({query,values:queryParams})).map(v=>Application.parse(v));
}
async function allApps() {
    if (allAppsCache) return allAppsCache.map(v=>Application.parse(v));
    else return (allAppsCache = (await client.query(`SELECT * FROM ${APP_TABLE.NAME} ORDER BY name COLLATE NOCASE ASC`))).map(v=>Application.parse(v));
}


async function getAdminByUsername(username) {
    return (await client.query({query:`SELECT * FROM ${ADMIN_USER_TABLE.NAME} WHERE username=? LIMIT 1`,values:[username]}))[0];
}
async function createAdminAccount(username,hashedpass) {
    var id = genUUID();
    await client.query({query:`INSERT INTO ${ADMIN_USER_TABLE.NAME} (id,username,hashedpass) VALUES (?,?,?)`,values:[id,username,hashedpass]});
    return id;
}
async function adminsExist() {
    return (await client.query(`SELECT id FROM ${ADMIN_USER_TABLE.NAME} LIMIT 1`)).length > 0;
}


async function tryInitDB() {
    //await client.connect();

    await Promise.all([
        client.query("CREATE TABLE IF NOT EXISTS "+APP_TABLE.NAME+" "+tableColsStr(APP_TABLE.COLS)),
        client.query("CREATE TABLE IF NOT EXISTS "+ADMIN_USER_TABLE.NAME+" "+tableColsStr(ADMIN_USER_TABLE.COLS))
    ]);
}


(async()=>{
    await tryInitDB();
    //if ((await client.query("SELECT id FROM "+APP_TABLE.NAME+" LIMIT 1")).rowCount == 0)
    //    await Promise.all(lpcsvUtil.convertAppsCSV(lpcsvUtil.getAppsCSV()).map(app=>addApp(app)));
})().catch(e=>{throw e});

export default {
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