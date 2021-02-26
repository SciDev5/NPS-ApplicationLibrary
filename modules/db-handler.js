import { deepFreeze } from "./utils";
import { APPROVAL_STATUSES, PRIVACY_STATUSES, Application } from "./application";
const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(":memory:");


const APP_TABLE = {
    NAME:"applications",
    COLS:[
        {name:"id", type:"INT", primaryKey:true},
        {name:"name", type:"TEXT", notNull:true},
        {name:"url", type:"TEXT"},
        {name:"tags", type:"INT[]"},
        {name:"approvalStatus", type:`ENUM(${APPROVAL_STATUSES.map(s=>`"${s}"`).join()})`, notNull:true, default: APPROVAL_STATUSES[0]},
        {name:"privacyStatus", type:`ENUM(${PRIVACY_STATUSES.map(s=>`"${s}"`).join()})`, notNull:true, default: PRIVACY_STATUSES[0]}
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
        var clst = [col.name,col.type];
        if (col.notNull) clst.push("NOT NULL");
        if (col.primaryKey) clst.push("PRIMARY KEY");
        if (col.unique) clst.push("UNIQUE");
        if (col.default) clst.push("DEFAULT("+col.default+")");
        slst.push(clst.join(" "));
    }
    return `(${slst.join(", ")})`;
}

/*async function editAppTags(appId,tagCb) {
    var {tags} = await asyncCMD("get","SELECT tags FROM "+APP_TABLE.NAME+" WHERE id=?",[appId]);
    await asyncCMD("run","UPDATE "+APP_TABLE.NAME+" SET tags=?::INT[] WHERE id=?",[appId,tags]);
}*/

function getAppValidKVPairs(app) {
    var keys = [], values = [], appjson = app.toJSON(); const allowedKeys = ["name","url","tags","approvalStatus","privacyStatus"];
    for (var key in appjson) if (allowedKeys.includes(key)) {
        keys.push(key);
        values.push(appjson[key]);
    }
}
async function updtApp(appId,app) {
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
async function searchApps(searchQuery) {
    var {name,tags,platforms,approvalStatuses, privacyStatuses} = searchQuery;
    var queryParams = [];
    var query = "SELECT id FROM "+APP_TABLE.NAME;
    var append = (qstr,qprm)=>{
        if (queryParams.length == 0) query += " WHERE "+qstr;
        else query += " AND "+qstr;
        queryParams = queryParams.push(qprm);
    };
    if (name) append("name LIKE '%?%'")
    if (tags && tags.length) append("ANY(tag) in ?",tags);
    if (platforms && platforms.length) append("ANY(platform) in ?",platforms);
    if (approvalStatuses && approvalStatuses.length) append("approvalStatus in ?",approvalStatuses)
    if (privacyStatuses && privacyStatuses.length) append("privacyStatus in ?",privacyStatuses)
    return (await asyncCMD("all",query,queryParams)).map(v=>new Application(v));
}


async function tryInitDB() {
    await Promise.all([
        asyncCMD("run","CREATE TABLE IF NOT EXISTS "+APP_TABLE.NAME+" "+tableColsStr(APP_TABLE.COLS),[]),
        asyncCMD("run","CREATE TABLE IF NOT EXISTS "+TAG_TABLE.NAME+" "+tableColsStr(TAG_TABLE.COLS),[])
    ]);
}


tryInitDB();

(async()=>{
    await new Promise(res=>setTimeout(()=>{db.close();res()},4000));
})();