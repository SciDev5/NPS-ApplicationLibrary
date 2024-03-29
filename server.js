import database from "./modules/db-handler.js";
import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, APPROVAL_STATUSES_NAME, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, GRADE_LEVELS, GRADE_LEVELS_NAME, SUBJECTS, SUBJECTS_NAME } from "./public/application.js";
import bodyParser from "body-parser";
import express from "express";
import {getTranslationMap,DEFAULT_LANG, LANGUAGE_INTERNAL_NAMES, LANGUAGE_INTERNAL_NAMES_READY, ALL_LANGS, getApproxLang} from "./modules/lang.js";
import auth from "./modules/auth.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import https from "https";
import http from "http";
import helmet from "helmet";
import { v4 as UUIDv4 } from "uuid";
import { readFileSync } from "fs";
const app = express();

app.use(helmet());

app.set("view engine", "pug");
app.use(express.static("./public/"));

app.use(bodyParser.json({strict:false}))
app.use(cookieParser());

// Create a new session middleware for admin login.
app.use(session(
  {
    key: "admin_session",
    secret: UUIDv4(),
    resave: true,
    saveUninitialized: false,
    cookie: {
      expires: 24*60*60*1000,
      secure: false
    }
  }
));

function getTheme(req,res) {
    var theme = req.query["theme"] || req.cookies["theme_cookie"] || DEFAULT_COLOR_THEME;
    res.cookie("theme_cookie",theme,{maxAge:Infinity});
    return theme;
}

function getBestLang(langs) {
    return langs.map(lId=>getApproxLang(lId)).find(v=>v!=null) || DEFAULT_LANG;
}
async function pageCommonInfo(req,res) {
    var lang = getApproxLang(req.query["lang"]||getBestLang(req.acceptsLanguages()));
    var theme = getTheme(req,res);
    var translation = await getTranslationMap(lang);
    await LANGUAGE_INTERNAL_NAMES_READY;
    return {lang,theme,translation};
}

const DEFAULT_COLOR_THEME = "light";
app.get("/",async (req,res)=>{
    var searchParams = []; // [{id:"p",name:"P",options:[{id:"1",name:"one"}]}]
    searchParams.push({id:"approval",name:"application.approvalStatus",many:true,options:new Array(APPROVAL_STATUSES.length).fill().map((_,i)=>({id:APPROVAL_STATUSES[i],name:APPROVAL_STATUSES_NAME[i]}))});
    searchParams.push({id:"privacy",name:"application.privacyStatus",many:true,options:new Array(PRIVACY_STATUSES.length).fill().map((_,i)=>({id:PRIVACY_STATUSES[i],name:PRIVACY_STATUSES_NAME[i]}))});
    searchParams.push({id:"gradeLevel",name:"application.gradeLevel",many:true,options:new Array(GRADE_LEVELS.length).fill().map((_,i)=>({id:GRADE_LEVELS[i],name:GRADE_LEVELS_NAME[i]}))});
    var {lang,theme,translation} = await pageCommonInfo(req,res);
    res.render("index",{searchParams,lang,theme,translation,langNames:LANGUAGE_INTERNAL_NAMES,editor:req.query.hasOwnProperty("noedit")?false:await auth.getSignedInAdmin(req)});
});
app.get("/editor/:id",async (req,res)=>{
    var app = await database.apps.get(req.params["id"]);
    if (app == null || !await auth.getSignedInAdmin(req)) { res.redirect("/"); return; }
    var {lang,theme,translation} = await pageCommonInfo(req,res);

    var appInfoLists = {};
    appInfoLists.approval = {name:"application.approvalStatus",many:false,initialState:APPROVAL_STATUSES.indexOf(app.approval),options:new Array(APPROVAL_STATUSES.length).fill().map((_,i)=>({id:APPROVAL_STATUSES[i],name:APPROVAL_STATUSES_NAME[i]}))};
    appInfoLists.privacy = {name:"application.privacyStatus",many:false,initialState:PRIVACY_STATUSES.indexOf(app.privacy),options:new Array(PRIVACY_STATUSES.length).fill().map((_,i)=>({id:PRIVACY_STATUSES[i],name:PRIVACY_STATUSES_NAME[i]}))};
    appInfoLists.gradeLevel = {name:"application.gradeLevel",many:true,initialState:app.grades.map(v=>GRADE_LEVELS.indexOf(v)),options:new Array(GRADE_LEVELS.length).fill().map((_,i)=>({id:GRADE_LEVELS[i],name:GRADE_LEVELS_NAME[i]}))};
    appInfoLists.subject = {name:"application.subject",many:true,initialState:app.subjects.map(v=>SUBJECTS.indexOf(v)),options:new Array(SUBJECTS.length).fill().map((_,i)=>({id:SUBJECTS[i],name:SUBJECTS_NAME[i]}))};
    appInfoLists.platform = {name:"application.platform",many:true,initialState:app.platforms.map(v=>PLATFORMS.indexOf(v)),options:new Array(PLATFORMS.length).fill().map((_,i)=>({id:PLATFORMS[i],name:PLATFORMS_NAME[i]}))};

    res.render("app",{app:app.toJSON(true),lang,theme,translation,langNames:LANGUAGE_INTERNAL_NAMES,appInfoLists});
});
app.get("/lang/:lang",async (req,res)=>{
    res.json(await getTranslationMap(req.params["lang"]));
});


app.post("/admin/make-token", async (req,res)=>{
    if (await auth.getSignedInAdmin(req)) {
        var token = await auth.createAdminAccountToken();
        res.json({success:true,token});
    } else {
        res.json({success:false});
    }
});
app.post("/admin/signin", async (req,res)=>{
    var {username,password} = req.body;
    if (!username || !password) { res.json({success:false,reason:"missing-credentials"}); return; }
    var id = await auth.authCredentials(username.trim(),password.trim());
    if (id) {
        auth.signinAdmin(id,req);
        res.json({success:true});
    } else {
        res.json({success:false,reason:"invalid-credentials"});
    }
});
app.post("/admin/signout", async (req,res)=>{
    auth.signoutAdmin(res);
    res.json({success:true});
});
app.post("/admin/signup", async (req,res)=>{
    var {username,password,code} = req.body;
    if (!username || !password) { res.json({success:false,reason:"missing-credentials"}); return; }
    var id = auth.createAccount(code,username.trim(),password.trim());
    if (id) {
        auth.signinAdmin(id,req);
        res.json({success:true});
    } else {
        res.json({success:false,reason:"invalid-credentials"});
    }
});
app.get("/admin", async (req,res)=>{
    var {lang,theme,translation} = await pageCommonInfo(req,res);
    var code = (await auth.isNoAdmins())?"first":req.query["signup-code"];
    res.render("admin",{editor:await auth.getSignedInAdmin(req),code,lang,theme,translation,langNames:LANGUAGE_INTERNAL_NAMES});
});


app.get("/apps/search",async(req,res)=>{
    try {
        var {name,platforms,subjects,grades,approval,privacy,platformsRequireAll,gradeLevelsRequireAll,subjectsRequireAll} = req.query;
        if (!name&&!platforms&&!approval&&!privacy&&!grades&&!subjects) {res.send(await database.apps.getAll()); return}
        if (platforms) platforms = JSON.parse(platforms);
        if (platforms instanceof Array) platforms=platforms.map(i=>PLATFORMS[i]).filter(Boolean); else platforms = undefined;
        if (grades) grades = JSON.parse(grades);
        if (grades instanceof Array) grades=grades.map(i=>GRADE_LEVELS[i]).filter(Boolean); else grades = undefined;
        if (subjects) subjects = JSON.parse(subjects);
        if (subjects instanceof Array) subjects=subjects.map(i=>PLATFORMS[i]).filter(Boolean); else subjects = undefined;
        if (approval) approval = JSON.parse(approval);
        if (approval instanceof Array) approval=approval.map(i=>APPROVAL_STATUSES[i]).filter(Boolean); else approval = undefined;
        if (privacy) privacy = JSON.parse(privacy);
        if (privacy instanceof Array) privacy=privacy.map(i=>PRIVACY_STATUSES[i]).filter(Boolean); else privacy = undefined;
        platformsRequireAll = platformsRequireAll=="true"||platformsRequireAll==true;
        gradeLevelsRequireAll = gradeLevelsRequireAll=="true"||gradeLevelsRequireAll==true;
        subjectsRequireAll = subjectsRequireAll=="true"||subjectsRequireAll==true;
        console.log({name,platforms,grades,subjects,approval,privacy,platformsRequireAll,gradeLevelsRequireAll,subjectsRequireAll});
        res.send(await database.apps.search({name,platforms,grades,subjects,approval,privacy,platformsRequireAll,gradeLevelsRequireAll,subjectsRequireAll}));
    } catch (e) {
        res.status(400);
        console.error(e);
        res.send(e);
    }
});
app.get("/apps/all",async(req,res)=>{
    try {
        res.send((await database.apps.getAll()).map(v=>v.toJSON(true)));
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});
app.get("/apps/get/:id",async(req,res)=>{
    try {
        res.send(await database.apps.get(req.params["id"]));
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});
app.post("/apps/edit/:id",async(req,res)=>{
    if (!await auth.getSignedInAdmin(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        await database.apps.update(req.params["id"],Application.parse(req.body));
        res.json({success:true});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error:error.stack});
    }
});
app.post("/apps/del/:id",async(req,res)=>{
    if (!await auth.getSignedInAdmin(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        await database.apps.del(req.params["id"]);
        res.json({success:true});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error:error.stack});
    }
});
app.post("/apps/add/",async(req,res)=>{
    if (!await auth.getSignedInAdmin(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        var id = await database.apps.add(Application.parse(req.body));
        res.json({success:true,id});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error});
    }
});

/////// JANKY CODE HERE TO HOLD US OVER UNTIL V2 RELEASES
app.post("/apps.json",async(req,res)=>{
    await appsImport(req,res,v=>v);
});
async function appsExport(res,type,encode) {
    try {
        const data = encode((await database.apps.getAll()).map(v=>v.toJSON(true,true)));
        res.header("Content-Type",type);
        res.send(data);
    } catch (e) {
        console.error(e);
        res.status(400);
        res.send(e);
    }
}
async function appsImport(req,res,decode) {
    if (!await auth.getSignedInAdmin(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        const data = decode(req.body);
        if (!(data instanceof Array)) throw new Error("body not of type array")
        var ress = data.map(v=>database.apps.add(Application.parse(v)));
        var ids = [];
        for (var id of ress) ids.push(await id);
        res.json({success:true,ids});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error});
    }
}
const APPS_ENT_ORDER = ["id","name","url","approval","privacy","platforms","subjects","grades"];
/**
 * @param {{[key:string]:string}[]} data
 * @param {string[]} keys
 * @param {string} separator
 * @param {(v:string)=>string} preprocess*/
 function xsvSerialize(data,keys,separator,preprocess) {
    var lines = data.map(v=>keys.map(key=>preprocess(v[key])));
    lines = [keys, ...lines];
    return lines.map(v=>v.join(separator)).join("\n");
}
/**
 * @param {string} data
 * @param {string} separator*/
function xsvDeserialize(data,separator) {
    var lines = data.split("\n").map(v=>v.split(separator));
    var keys = lines.splice(0,1)[0];
    return lines.map(line=>Object.fromEntries(line.map((v,i)=>[keys[i],v])));
}
app.get("/apps.json",async(req,res)=>{
    appsExport(res,"application/json",vs=>JSON.stringify(vs));
});
app.get("/apps.csv",async(req,res)=>{
    appsExport(res,"text/csv",vs=>xsvSerialize(vs,APPS_ENT_ORDER,",",v=>{
        if (/,|"/.test(v))
            return `"${v.replace(/"/g,'""')}"`;
        else return v;
    }));
});
app.get("/apps.tsv",async(req,res)=>{
    appsExport(res,"text/tab-separated-values",vs=>xsvSerialize(vs,APPS_ENT_ORDER,"\t",v=>v));
});
//////////\\\\


const PORT = process.env.PORT||80, PORT_HTTPS = process.env.PORT_HTTPS||443;
if (PORT == 80) { 
    const SSL_KEY = readFileSync(process.env.SSL_KEY||"./.data/ssl.key");
    const SSL_CERT = readFileSync(process.env.SSL_CERT||"./.data/ssl.crt");

    http.createServer(app).listen(PORT,()=>console.log(`HTTP SERVER LISTENING: [port ${PORT}]`))
    https.createServer({key:SSL_KEY,cert:SSL_CERT},app).listen(PORT_HTTPS,()=>console.log(`HTTPS SERVER LISTENING: [port ${PORT_HTTPS}]`))
} else {
    http.createServer(app).listen(PORT,()=>console.log(`HTTP SERVER LISTENING: [port ${PORT}]`))
}


process.addListener("uncaughtException",(err)=>{
    console.error(err);
    console.error(err.stack);
    console.log("EXCEPTION WAS UNCAUGHT, EXITING IN 5s.");
    var t = new Date().getTime()
    while(new Date().getTime()<t+5000);
    process.exit();
});