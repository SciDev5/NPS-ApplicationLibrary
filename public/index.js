import { Application } from "./application.js";
import domWorker from "./dom-worker.js";

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
async function paramFetch(uri,obj) {
    var params = new URLSearchParams();
    for (var i in obj) params.set(i,obj[i]);
    return await (await fetch(uri+"?"+params,{method:"get"})).json();
}
async function getTranslationMap() {
    return await fetch("/lang/"+document.getElementsByTagName("html")[0].lang).then(r=>r.json());
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
    Object.defineProperty(window,"lang",{writable:false,value:Object.freeze(await getTranslationMap())});
    Object.defineProperty(window,"langId",{writable:false,value:document.getElementsByTagName("html")[0].lang});
    console.log(allApps);
    domWorker.populateApps(allApps);
    document.querySelectorAll("#search-refresh-button-inline").forEach(v=>v.addEventListener("click",searchEvHandler));
    //document.querySelectorAll("#search-refresh-popup").forEach(v=>v.addEventListener("mouseenter",searchEvHandler));
    document.querySelectorAll("#search-refresh-popup").forEach(v=>v.addEventListener("click",searchEvHandler));
    document.getElementById("name-search").addEventListener("keyup",e1=>{console.log(e1);if (e1.key=="Enter")searchEvHandler(e1)});
});