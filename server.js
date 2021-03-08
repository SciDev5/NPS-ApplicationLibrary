import database from "./modules/db-handler.js";
import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, APPROVAL_STATUSES_NAME, PRIVACY_STATUSES_NAME, PLATFORMS_NAME } from "./public/application.js";
import bodyParser from "body-parser";
import express from "express";
const app = express();

app.set("view engine", "pug");
app.use(express.static("./public/"));

app.use(bodyParser.json({strict:false}))

app.get("/",(req,res)=>{
    var searchParams = []; // [{id:"p",name:"P",options:[{id:"1",name:"one"}]}]
    searchParams.push({id:"approval",name:"Approval Status",options:new Array(APPROVAL_STATUSES.length).fill().map((_,i)=>({id:APPROVAL_STATUSES[i],name:APPROVAL_STATUSES_NAME[i]}))});
    searchParams.push({id:"privacy",name:"Privacy Status",options:new Array(PRIVACY_STATUSES.length).fill().map((_,i)=>({id:PRIVACY_STATUSES[i],name:PRIVACY_STATUSES_NAME[i]}))});
    searchParams.push({id:"platform",name:"Platforms",options:new Array(PLATFORMS.length).fill().map((_,i)=>({id:PLATFORMS[i],name:PLATFORMS_NAME[i]}))});

    res.render("index",{searchParams});
})

app.post("/sql",async(req,res)=>{
    res.send(await database.sql("all",req.body["sql"],req.body["params"]||[]));
});

app.get("/apps/search",async(req,res)=>{
    try {
        var {name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll} = req.query;
        if (!name&&!tags&&!platforms&&!approvalStatus&&!privacyStatus&&!tagsRequireAll&&!platformsRequireAll) {res.send(await database.apps.getAll()); return}
        if (tags) tags = JSON.parse(tags);
        if (platforms) platforms = JSON.parse(platforms);
        if (approvalStatus) approvalStatus = JSON.parse(approvalStatus);
        if (privacyStatus) privacyStatus = JSON.parse(privacyStatus);
        tagsRequireAll = tagsRequireAll=="true"||tagsRequireAll==true;
        platformsRequireAll = platformsRequireAll=="true"||platformsRequireAll==true;
        res.send(await database.apps.search({name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll}));
    } catch (e) {
        res.status(400);
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


app.get("/tags/all",async(req,res)=>{
    try {
        res.send(await database.tags.getAll());
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});
app.get("/tags/get/:id",async(req,res)=>{
    try {
        res.send(await database.tags.get(req.params["id"]));
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});
app.get("/tags/search",async(req,res)=>{
    try {
        var {name} = req.query;
        if (!name) {res.send(await database.tags.getAll()); return}
        res.send(await database.tags.search({name}));
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});


app.listen(process.env.PORT,()=>{
    console.log(`SERVER LISTENING: [port ${process.env.PORT}]`);
});



process.addListener("uncaughtException",(err)=>{
    console.error(err);
    console.log("EXCEPTION WAS UNCAUGHT, EXITING IN 5s.");
    var t = new Date().getTime()
    while(new Date().getTime()<t+5000);
    process.exit();
});