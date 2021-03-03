import { asyncCMD as sql, searchApps, getApp, allApps } from "./modules/db-handler.js";
import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS } from "./public/application.js";
import bodyParser from "body-parser";
import express from "express";
const app = express();

app.set("view engine", "pug");
app.use(express.static("./public/"));

app.use(bodyParser.json({strict:false}))

app.get("/",(req,res)=>{
    res.render("index",{yeet:[1,2,4,2]});
})

app.get("/sql/:cmd",async(req,res)=>{
    res.send(await sql("all",req.params["cmd"],[]));
});
app.get("/apps/search",async(req,res)=>{
    try {
        var {name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll} = req.query;
        if (tags) tags = JSON.parse(tags);
        if (platforms) platforms = JSON.parse(platforms);
        if (approvalStatus) approvalStatus = JSON.parse(approvalStatus);
        if (privacyStatus) privacyStatus = JSON.parse(privacyStatus);
        res.send(await searchApps({name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll}));
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});
app.get("/apps/all",async(req,res)=>{
    try {
        res.send(await allApps());
    } catch (e) {
        res.status(400);
        res.send(e);
    }
});
app.get("/apps",async(req,res)=>{
    try {
        res.send(await getApp(req.query["id"]));
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