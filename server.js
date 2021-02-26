require("./modules/db-handler");

const express = require("express");
const app = express();

app.set("view engine", "pug");
app.use(express.static(__dirname+"/public/"));

app.get("/",(req,res)=>{
    res.render("index",{yeet:[1,2,4,2]});
})

app.listen(process.env.PORT,()=>{
    console.log(`SERVER LISTENING: [port ${process.env.PORT}]`);
});