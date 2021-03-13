import { Application } from "./application.js";
import domWorker from "./dom-worker.js";

async function searchApps(/**@type {{name,platforms,approvalStatus,privacyStatus,platformsRequireAll}}*/query) {
    var {name,platforms,approvalStatus,privacyStatus,platformsRequireAll} = query;
    var queryOut = {}
    if(name)queryOut.name=name;
    if(platforms)queryOut.platforms=JSON.stringify(platforms);
    if(approvalStatus)queryOut.approvalStatus=JSON.stringify(approvalStatus);
    if(privacyStatus)queryOut.privacyStatus=JSON.stringify(privacyStatus);
    queryOut.platformsRequireAll=!!platformsRequireAll;
    return (await paramFetch("/apps/search",queryOut)).map(v=>Application.parse(v));
}
async function getAllApps() {
    return (await (await fetch("/apps/all")).json()).map(v=>Application.parse(v));
}
async function getApp(id) {
    return Application.parse(await (await fetch("/apps/get/"+id)).json());
}
async function paramFetch(uri,obj) {
    var params = new URLSearchParams();
    for (var i in obj) params.set(i,obj[i]);
    return await (await fetch(uri+"?"+params,{method:"get"})).json();
}

async function searchEvHandler(e) {
    if (!e.isTrusted) return;
    if (!domWorker.getSearchChanged()) return;
    var search = domWorker.getSearch();
    domWorker.onSearch();
    var apps = await searchApps(search);
    domWorker.onSearchEnd(apps);
}

addEventListener("load",async e=>{
    var allApps = await getAllApps();
    console.log(allApps);
    domWorker.populateApps(allApps);
    document.querySelectorAll("#search-refresh-button-inline").forEach(v=>v.addEventListener("click",searchEvHandler));
    //document.querySelectorAll("#search-refresh-popup").forEach(v=>v.addEventListener("mouseenter",searchEvHandler));
    document.querySelectorAll("#search-refresh-popup").forEach(v=>v.addEventListener("click",searchEvHandler));
    document.getElementById("name-search").addEventListener("keyup",e1=>{console.log(e1);if (e1.key=="Enter")searchEvHandler(e1)});
});

window.f = {searchApps, getAllApps, paramFetch, getApp}