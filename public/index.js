import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS } from "./application.js";
import domWorker from "./dom-worker.js";

async function searchApps(/**@type {{name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll}}*/query) {
    var {name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll} = query;
    var queryOut = {}
    if(name)queryOut.name=name;
    if(tags)queryOut.tags=JSON.stringify(tags);
    if(platforms)queryOut.platforms=JSON.stringify(platforms);
    if(approvalStatus)queryOut.approvalStatus=JSON.stringify(approvalStatus);
    if(privacyStatus)queryOut.privacyStatus=JSON.stringify(privacyStatus);
    queryOut.tagsRequireAll=!!tagsRequireAll;
    queryOut.platformsRequireAll=!!platformsRequireAll;
    return (await paramFetch("/apps/search",queryOut)).map(v=>Application.parse(v));
}
async function getAllApps() {
    return (await (await fetch("/apps/all")).json()).map(v=>Application.parse(v));
}
async function getApp(id) {
    return Application.parse(await (await fetch("/apps/get/"+id)).json());
}
async function searchTags(/**@type {{name}}*/query) {
    var {name} = query;
    var queryOut = {}
    if(name)queryOut.name=name;
    return await paramFetch("/tags/search",queryOut);
}
async function getAllTags() {
    return await (await fetch("/tags/all")).json();
}
async function getTag(id) {
    return await (await fetch("/tags/get/"+id)).json();
}
async function paramFetch(uri,obj) {
    var params = new URLSearchParams();
    for (var i in obj) params.set(i,obj[i]);
    return await (await fetch(uri+"?"+params,{method:"get"})).json();
}


addEventListener("load",async e=>{
    var allApps = await getAllApps();
    console.log(allApps);
    console.log(await getAllTags());
    var appContainer = document.getElementById("apps-list");
    for (var i = 0; i < allApps.length; i++) {
        appContainer.appendChild(domWorker.createAppDiv(allApps[i]));
    }
});

window.f = {searchApps,getAllApps,paramFetch,getApp, searchTags,getAllTags,getTag}