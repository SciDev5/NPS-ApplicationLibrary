import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS } from "./application.js";
import domWorker from "./dom-worker.js";

async function searchApp(/**@type {{name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll}}*/query) {
    var {name,tags,platforms,approvalStatus,privacyStatus,tagsRequireAll,platformsRequireAll} = query;
    var queryOut = {}
    if(name)queryOut.name=name;
    if(tags)queryOut.tags=JSON.stringify(tags);
    if(platforms)queryOut.platforms=JSON.stringify(platforms);
    if(approvalStatus)queryOut.approvalStatus=JSON.stringify(approvalStatus);
    if(privacyStatus)queryOut.privacyStatus=JSON.stringify(privacyStatus);
    queryOut.tagsRequireAll=!!tagsRequireAll;
    queryOut.platformsRequireAll=!!platformsRequireAll;
    return await paramFetch("/apps/search",queryOut);
}
async function getAllApps() {
    return await (await fetch("/apps/all")).json();
}
async function paramFetch(uri,obj) {
    var params = new URLSearchParams();
    for (var i in obj) params.set(i,obj[i]);
    return await (await fetch(uri+"?"+params,{method:"get"})).json();
}


addEventListener("load",async e=>{
    var allApps = (await getAllApps()).map(v=>Application.parse(v));
    console.log(allApps);
    var appContainer = document.getElementById("apps-container");
    for (var i = 0; i < allApps.length; i++) {
        appContainer.appendChild(domWorker.createAppDiv(allApps[i]));
    }
});

window.f = {searchApp,getAllApps,paramFetch}