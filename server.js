import database from "./modules/db-handler.js";
import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, APPROVAL_STATUSES_NAME, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, GRADE_LEVELS, GRADE_LEVELS_NAME, SUBJECTS, SUBJECTS_NAME } from "./public/application.js";
import bodyParser from "body-parser";
import express from "express";
import {getTranslationMap,DEFAULT_LANG, LANGUAGE_INTERNAL_NAMES, LANGUAGE_INTERNAL_NAMES_READY, ALL_LANGS} from "./modules/lang.js";
import auth from "./modules/auth.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import { v4 as UUIDv4 } from "uuid";
const app = express();

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


const DEFAULT_COLOR_THEME = "light";
app.get("/",async (req,res)=>{
    var searchParams = []; // [{id:"p",name:"P",options:[{id:"1",name:"one"}]}]
    searchParams.push({id:"approval",name:"application.approvalStatus",many:true,options:new Array(APPROVAL_STATUSES.length).fill().map((_,i)=>({id:APPROVAL_STATUSES[i],name:APPROVAL_STATUSES_NAME[i]}))});
    searchParams.push({id:"privacy",name:"application.privacyStatus",many:true,options:new Array(PRIVACY_STATUSES.length).fill().map((_,i)=>({id:PRIVACY_STATUSES[i],name:PRIVACY_STATUSES_NAME[i]}))});
    searchParams.push({id:"gradeLevel",name:"application.gradeLevel",many:true,options:new Array(GRADE_LEVELS.length).fill().map((_,i)=>({id:GRADE_LEVELS[i],name:GRADE_LEVELS_NAME[i]}))});
    var lang = req.query["lang"];
    if (!ALL_LANGS.includes(lang)) lang = DEFAULT_LANG;
    lang = lang.replace(/-/g,"_").toLowerCase();
    var theme = req.query["theme"] || req.cookies["theme_cookie"] || DEFAULT_COLOR_THEME;
    res.cookie("theme_cookie",theme,{maxAge:Infinity});
    var translation = await getTranslationMap(lang);
    await LANGUAGE_INTERNAL_NAMES_READY;
    res.render("index",{searchParams,lang,theme,translation,langNames:LANGUAGE_INTERNAL_NAMES,editor:req.query.hasOwnProperty("noedit")?false:await auth.getSignedInAdmin(req)});
});
app.get("/editor/:id",async (req,res)=>{
    var app = await database.apps.get(req.params["id"]);
    if (app == null || !await auth.getSignedInAdmin(req)) { res.redirect("/"); return; }
    var lang = req.query["lang"] || DEFAULT_LANG;
    lang = lang.replace(/-/g,"_").toLowerCase();
    var theme = req.query["theme"] || req.cookies["theme_cookie"] || DEFAULT_COLOR_THEME;
    res.cookie("theme_cookie",theme,{maxAge:Infinity});
    var translation = await getTranslationMap(lang);
    await LANGUAGE_INTERNAL_NAMES_READY;

    var appInfoLists = {};
    appInfoLists.approval = {name:"application.approvalStatus",many:false,initialState:APPROVAL_STATUSES.indexOf(app.approvalStatus),options:new Array(APPROVAL_STATUSES.length).fill().map((_,i)=>({id:APPROVAL_STATUSES[i],name:APPROVAL_STATUSES_NAME[i]}))};
    appInfoLists.privacy = {name:"application.privacyStatus",many:false,initialState:PRIVACY_STATUSES.indexOf(app.privacyStatus),options:new Array(PRIVACY_STATUSES.length).fill().map((_,i)=>({id:PRIVACY_STATUSES[i],name:PRIVACY_STATUSES_NAME[i]}))};
    appInfoLists.gradeLevel = {name:"application.gradeLevel",many:true,initialState:app.gradeLevels.map(v=>GRADE_LEVELS.indexOf(v)),options:new Array(GRADE_LEVELS.length).fill().map((_,i)=>({id:GRADE_LEVELS[i],name:GRADE_LEVELS_NAME[i]}))};
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
    var lang = req.query["lang"] || DEFAULT_LANG;
    lang = lang.replace(/-/g,"_").toLowerCase();
    var theme = req.query["theme"] || req.cookies["theme_cookie"] || DEFAULT_COLOR_THEME;
    res.cookie("theme_cookie",theme,{maxAge:Infinity});
    var translation = await getTranslationMap(lang);
    await LANGUAGE_INTERNAL_NAMES_READY;
    var code = req.query["signup-code"];
    res.render("admin",{editor:await auth.getSignedInAdmin(req),code,lang,theme,translation,langNames:LANGUAGE_INTERNAL_NAMES});
});


app.get("/apps/search",async(req,res)=>{
    try {
        var {name,platforms,subjects,gradeLevels,approvalStatus,privacyStatus,platformsRequireAll,gradeLevelsRequireAll,subjectsRequireAll} = req.query;
        if (!name&&!platforms&&!approvalStatus&&!privacyStatus&&!gradeLevels&&!subjects) {res.send(await database.apps.getAll()); return}
        if (platforms) platforms = JSON.parse(platforms);
        if (gradeLevels) gradeLevels = JSON.parse(gradeLevels);
        if (subjects) subjects = JSON.parse(subjects);
        if (approvalStatus) approvalStatus = JSON.parse(approvalStatus);
        if (privacyStatus) privacyStatus = JSON.parse(privacyStatus);
        platformsRequireAll = platformsRequireAll=="true"||platformsRequireAll==true;
        gradeLevelsRequireAll = gradeLevelsRequireAll=="true"||gradeLevelsRequireAll==true;
        subjectsRequireAll = subjectsRequireAll=="true"||subjectsRequireAll==true;
        res.send(await database.apps.search({name,platforms,gradeLevels,subjects,approvalStatus,privacyStatus,platformsRequireAll,gradeLevelsRequireAll,subjectsRequireAll}));
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



app.listen(process.env.PORT||80,()=>{
    console.log(`SERVER LISTENING: [port ${process.env.PORT||80}]`);
});

(async()=>{
    auth.createAccount(await auth.createAdminAccountToken(),"admin","admin");
})();


process.addListener("uncaughtException",(err)=>{
    console.error(err);
    console.log("EXCEPTION WAS UNCAUGHT, EXITING IN 5s.");
    var t = new Date().getTime()
    while(new Date().getTime()<t+5000);
    process.exit();
});