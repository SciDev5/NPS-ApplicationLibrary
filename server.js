import database from "./modules/db-handler.js";
import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, APPROVAL_STATUSES_NAME, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, GRADE_LEVELS, GRADE_LEVELS_NAME } from "./public/application.js";
import bodyParser from "body-parser";
import express from "express";
import {getTranslationMap,DEFAULT_LANG, LANGUAGE_INTERNAL_NAMES, LANGUAGE_INTERNAL_NAMES_READY} from "./modules/lang.js";
import { authenticateEdit } from "./modules/auth.js";
const app = express();

app.set("view engine", "pug");
app.use(express.static("./public/"));

app.use(bodyParser.json({strict:false}))


app.get("/",async (req,res)=>{
    var searchParams = []; // [{id:"p",name:"P",options:[{id:"1",name:"one"}]}]
    searchParams.push({id:"approval",name:"application.approvalStatus",options:new Array(APPROVAL_STATUSES.length).fill().map((_,i)=>({id:APPROVAL_STATUSES[i],name:APPROVAL_STATUSES_NAME[i]}))});
    searchParams.push({id:"privacy",name:"application.privacyStatus",options:new Array(PRIVACY_STATUSES.length).fill().map((_,i)=>({id:PRIVACY_STATUSES[i],name:PRIVACY_STATUSES_NAME[i]}))});
    searchParams.push({id:"gradeLevel",name:"application.gradeLevel",options:new Array(GRADE_LEVELS.length).fill().map((_,i)=>({id:GRADE_LEVELS[i],name:GRADE_LEVELS_NAME[i]}))});
    var lang = req.query["lang"] || DEFAULT_LANG;
    var translation = await getTranslationMap(lang);
    await LANGUAGE_INTERNAL_NAMES_READY;
    res.render("index",{searchParams,lang,translation,langNames:LANGUAGE_INTERNAL_NAMES,editor:authenticateEdit(req)});
});
app.get("/editor/:id",async (req,res)=>{
    var app = await database.apps.get(req.params["id"]);
    if (app == null || !authenticateEdit(req)) { res.redirect("back"); return; }
    var lang = req.query["lang"] || DEFAULT_LANG;
    var translation = await getTranslationMap(lang);
    await LANGUAGE_INTERNAL_NAMES_READY;
    res.render("app",{app:app.toJSON(true),lang,translation,langNames:LANGUAGE_INTERNAL_NAMES});
});
app.get("/lang/:lang",async (req,res)=>{
    res.json(await getTranslationMap(req.params["lang"]));
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
    if (!authenticateEdit(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        await database.apps.update(req.params["id"],Application.parse(req.body));
        res.json({success:true});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error});
    }
});
app.post("/apps/del/:id",async(req,res)=>{
    if (!authenticateEdit(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        await database.apps.del(req.params["id"]);
        res.json({success:true});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error:error.stack});
    }
});
app.post("/apps/add/",async(req,res)=>{
    if (!authenticateEdit(req)) { res.json({success:false,reason:"unauthenticated"}); return; }
    try {
        await database.apps.add(Application.parse(req.body));
        res.json({success:true});
    } catch (error) {
        res.status(400);
        res.json({sucess:false,reason:"error",error});
    }
});



app.listen(process.env.PORT||80,()=>{
    console.log(`SERVER LISTENING: [port ${process.env.PORT||80}]`);
});



process.addListener("uncaughtException",(err)=>{
    console.error(err);
    console.log("EXCEPTION WAS UNCAUGHT, EXITING IN 5s.");
    var t = new Date().getTime()
    while(new Date().getTime()<t+5000);
    process.exit();
});