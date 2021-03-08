import lpcsvUtil from "../modules/map-lpcsv-to-apparr.js";

import { deepFreeze } from "./utils.js";
import { APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, Application } from "../public/application.js";
import sqlite3 from "sqlite3";
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(":memory:");

var allAppsCache = undefined, allTagsCache = undefined;

const APP_TABLE = {
    NAME:"applications",
    COLS:[
        {name:"id", type:"INT", primaryKey:true, default: "random()"},
        {name:"name", type:"TEXT", notNull:true},
        {name:"url", type:"TEXT"},
        {name:"tags", type:"TEXT"},
        {name:"approvalStatus", type:"INT", enum:APPROVAL_STATUSES, notNull:true, default: 0},
        {name:"privacyStatus", type:"INT", enum:PRIVACY_STATUSES, notNull:true, default: 0},
        {name:"platforms", type:"TEXT", arrEnum:PLATFORMS, notNull:true, default: 0}
    ]
};
const TAG_TABLE = {
    NAME: "tags",
    COLS:[
        {name:"id", type:"INT", primaryKey:true, default:"random()"},
        {name:"name", type:"TEXT", unique:true}
    ]
};
deepFreeze([APP_TABLE,TAG_TABLE]);


function asyncCMD(cmd,query,params) {
    if (/^(UPDATE|INSERT)/i.test(query)) {
        if (new RegExp(APP_TABLE.NAME).test(query)) allAppsCache = undefined;
        if (new RegExp(TAG_TABLE.NAME).test(query)) allTagsCache = undefined;
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
    var keys = [], values = [], appjson = app.toJSON(); const allowedKeys = ["name","url","tags","approvalStatus","privacyStatus","platforms"];
    for (var key in appjson) if (allowedKeys.includes(key)) {
        keys.push(key);
        values.push(appjson[key]);
    }
    return {keys,values};
}
async function updateApp(/**@type {string}*/appId,/**@type {Application}*/app) {
    var {keys,values} = getAppValidKVPairs(app);
    return await asyncCMD("run","UPDATE "+APP_TABLE.NAME+" SET "+keys.map(s=>`${s}=?`).join(",")+" WHERE id=?",values);
}
async function addApp(/**@type {Application}*/app) {
    var {keys,values} = getAppValidKVPairs(app);
    return await asyncCMD("run","INSERT INTO "+APP_TABLE.NAME+" ("+keys.join(",")+") VALUES ("+new Array(keys.length).fill("?").join(",")+")",values);
}
async function getApp(appId) {
    return new Application(await asyncCMD("get","SELECT * FROM "+APP_TABLE.NAME+" WHERE id=?",[appId]));
}
async function delApp(appId) {
    return await asyncCMD("run","DELETE FROM "+APP_TABLE.NAME+" WHERE id=?",[appId]);
}
async function searchApps(searchQuery) {
    var {name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll} = searchQuery;
    var queryParams = [];
    var query = "SELECT * FROM "+APP_TABLE.NAME;
    var n = 0;
    var append = (qstr,qprm)=>{
        if (n++ == 0) query += " WHERE "+qstr;
        else query += " AND "+qstr;
        if (qprm) queryParams.push(qprm);
    };
    if (name) append("name LIKE ?",`%${name}%`)
    if (tags && tags.length && tags.every(v=>Number.isSafeInteger(v))) 
        append(`(SELECT COUNT(*) FROM (
            WITH split(word, str) AS (
                SELECT '', tags||','
                UNION ALL SELECT
                substr(str, 0, instr(str, ',')),
                substr(str, instr(str, ',')+1)
                FROM split WHERE str!=''
            ) SELECT word FROM split WHERE word!='') WHERE word in ('${tags.join("','")}')) `+(tagsRequireAll?`== ${tags.length}`:"> 0"));
    if (platforms && platforms.length && platforms.every(v=>Number.isSafeInteger(v)))
        append(`(SELECT COUNT(*) FROM (
            WITH split(word, str) AS (
                SELECT '', platforms||','
                UNION ALL SELECT
                substr(str, 0, instr(str, ',')),
                substr(str, instr(str, ',')+1)
                FROM split WHERE str!=''
            ) SELECT word FROM split WHERE word!='') WHERE word in ('${platforms.join("','")}')) `+(platformsRequireAll?`== ${platforms.length}`:"> 0"));
    if (approvalStatus && approvalStatus.length && approvalStatus.every(v=>Number.isSafeInteger(v))) 
        append(`approvalStatus in ('${approvalStatus.join("','")}')`);
    if (privacyStatus && privacyStatus.length && privacyStatus.every(v=>Number.isSafeInteger(v))) 
        append(`privacyStatus in ('${privacyStatus.join("','")}')`);
    return (await asyncCMD("all",query,queryParams)).map(v=>Application.parse(v));
}
async function allApps() {
    if (allAppsCache) return allAppsCache.map(v=>Application.parse(v));
    else return (allAppsCache = await asyncCMD("all",`SELECT * FROM ${APP_TABLE.NAME}`)).map(v=>Application.parse(v));
}




async function updateTag(/**@type {string}*/tagId,/**@type {string}*/tagName) {
    return await asyncCMD("run","UPDATE "+TAG_TABLE.NAME+" SET name=? WHERE id=?",[tagName,tagId]);
}
async function addTag(/**@type {string}*/tagName) {
    return await asyncCMD("run","INSERT INTO "+TAG_TABLE.NAME+" (name) VALUES (?)",tagName);
}
async function getTag(/**@type {string}*/id) {
    return new Application(await asyncCMD("get","SELECT * FROM "+TAG_TABLE.NAME+" WHERE id=?",[id]));
}
async function searchTags(/**@type {string}*/tagName) {
    return (await asyncCMD("all","SELECT * FROM "+TAG_TABLE.NAME+" WHERE name LIKE ?",[`%${tagName}%`])).map(v=>Application.parse(v));
}
async function allTags() {
    if (allTagsCache) return allTagsCache;
    else return allTagsCache = await asyncCMD("all",`SELECT * FROM ${TAG_TABLE.NAME}`);
}
async function delTag(/**@type {string}*/tagId) {
    return await asyncCMD("run","DELETE FROM "+TAG_TABLE.NAME+" WHERE id=?",[tagId]);
}


async function tryInitDB() {
    await Promise.all([
        asyncCMD("run","CREATE TABLE IF NOT EXISTS "+APP_TABLE.NAME+" "+tableColsStr(APP_TABLE.COLS),[]),
        asyncCMD("run","CREATE TABLE IF NOT EXISTS "+TAG_TABLE.NAME+" "+tableColsStr(TAG_TABLE.COLS),[])
    ]);
}




(async()=>{
    await tryInitDB();
    
    var promises = [];
    promises.push(addApp(new Application({name:"A",tags:[1,2]})))
    promises.push(addApp(new Application({name:"B",tags:[3,4]})))
    promises.push(addApp(new Application({name:"B",tags:[1,2,3]})))
    for (var k of lpcsvUtil.convertLPCSV(lpcsvUtil.getLPCSV_test()))
        promises.push(addApp(k));
    await Promise.all(promises); promises = [];
    for (var k of ["eyy","bee","see","d"])
        promises.push(addTag(k));
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
    tags: {
        search:searchTags,
        get:getTag,
        getAll:allTags,
        add:addTag,
        del:delTag,
        update:updateTag
    }
}