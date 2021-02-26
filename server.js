import "./modules/db-handler";
import express, { static } from "express";
const app = express();

app.set("view engine", "pug");
app.use(static(__dirname+"/public/"));

app.get("/",(req,res)=>{
    res.render("index",{yeet:[1,2,4,2]});
})

app.listen(process.env.PORT,()=>{
    console.log(`SERVER LISTENING: [port ${process.env.PORT}]`);
});