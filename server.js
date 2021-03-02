import { asyncCMD as sql, searchApps } from "./modules/db-handler.js";
import express from "express";
const app = express();

app.set("view engine", "pug");
app.use(express.static("./public/"));

app.get("/",(req,res)=>{
    res.render("index",{yeet:[1,2,4,2]});
})

app.get("/sql/:cmd",async(req,res)=>{
    res.send(await sql("all",req.params["cmd"],[]));
});
app.get("/search",async(req,res)=>{
    var {name,tags} = req.query;
    tags = JSON.parse(tags);
    res.send((await searchApps({name,tags})).map(v=>v.toString().replace(/"/g,"'")));
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