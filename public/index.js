import { Application } from "./application.js";
import dom from "./dom/dom.js";
import indexDom from "./dom/index-dom.js";

import { paramFetchPost, paramFetch } from "./web/requests.js";


async function searchApps(/**@type {{name,gradeLevels,approvalStatus,privacyStatus,gradeLevelsRequireAll}}*/query) {
    var {name,gradeLevels,approvalStatus,privacyStatus,gradeLevelsRequireAll} = query;
    var queryOut = {}
    if(name)queryOut.name=name;
    if(gradeLevels)queryOut.gradeLevels=JSON.stringify(gradeLevels);
    if(approvalStatus)queryOut.approvalStatus=JSON.stringify(approvalStatus);
    if(privacyStatus)queryOut.privacyStatus=JSON.stringify(privacyStatus);
    queryOut.gradeLevelsRequireAll=!!gradeLevelsRequireAll;
    return (await paramFetch("/apps/search",queryOut)).map(v=>Application.parse(v));
}
async function getAllApps() {
    return (await (await fetch("/apps/all")).json()).map(v=>Application.parse(v));
}
async function getApp(id) {
    return Application.parse(await (await fetch("/apps/get/"+id)).json());
}


async function searchEvHandler(e) {
    if (!e.isTrusted) return;
    if (!indexDom.getSearchChanged()) return;
    var search = indexDom.getSearch();
    indexDom.onSearch();
    var apps = await searchApps(search);
    indexDom.onSearchEnd(apps);
}
async function addAppEvHandler(e) {
    var res = await paramFetchPost("/apps/add/",[],{name:"New App #"+Math.floor(Math.random()*10000)});
    window.location = "/editor/"+res.id+"?lang="+window.langId;
}

addEventListener("load",async e=>{
    await dom.init();
    indexDom.init();
    var allApps = await getAllApps();
    Object.defineProperty(window,"editor",{writable:false,value:!!document.getElementsByTagName("html")[0].getAttribute("editor")});
    console.log(allApps);
    indexDom.populateApps(allApps);
    document.querySelectorAll("#search-refresh-button-inline").forEach(v=>v.addEventListener("click",searchEvHandler));
    //document.querySelectorAll("#search-refresh-popup").forEach(v=>v.addEventListener("mouseenter",searchEvHandler));
    document.querySelectorAll("#search-refresh-popup").forEach(v=>v.addEventListener("click",searchEvHandler));
    document.getElementById("name-search").addEventListener("keyup",e1=>{if (e1.key=="Enter")searchEvHandler(e1)});
    if(window["editor"]) document.getElementById("add-element").addEventListener("click",addAppEvHandler);
});