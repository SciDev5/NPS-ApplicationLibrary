import { Application } from "./application.js";
import domWorker from "./dom-worker.js";

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


addEventListener("load",async e=>{
    var appId = window.location.pathname.split("/")[2];
    Object.defineProperty(window,"lang",{writable:false,value:Object.freeze(await getTranslationMap())});
    Object.defineProperty(window,"langId",{writable:false,value:document.getElementsByTagName("html")[0].lang});
    Object.defineProperty(window,"app",{writable:false,value:Object.freeze(await getApp(appId))});
    
});

window.f = {paramFetch, getApp}