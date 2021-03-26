import { Application } from "./application.js";
import dom from "./dom/dom.js";
import editorDom from "./dom/editor-dom.js";

async function getApp(id) {
    return Application.parse(await (await fetch("/apps/get/"+id)).json());
}
async function paramFetch(uri,obj) {
    var params = new URLSearchParams();
    for (var i in obj) params.set(i,obj[i]);
    return await (await fetch(uri+"?"+params,{method:"get"})).json();
}
async function paramFetchPost(uri,obj,body) {
    var params = new URLSearchParams();
    for (var i in obj) params.set(i,obj[i]);
    return await (await fetch(uri+"?"+params,{method:"post",body,headers:{"Content-Type":"application/json"}})).json();
}
async function getTranslationMap() {
    return await fetch("/lang/"+document.getElementsByTagName("html")[0].lang).then(r=>r.json());
}

async function updateApp() {
    return await paramFetchPost("/apps/edit/"+window.appId,[],JSON.stringify(window.app.toJSON()));
}
async function deleteApp() {
    return await paramFetchPost("/apps/del/"+window.appId,[]);
}

addEventListener("load",async e=>{
    editorDom.init();
    editorDom.callback.edit = updateApp;
    editorDom.callback.del = deleteApp;
    var appId = window.location.pathname.split("/")[2];
    window.appId = appId;
    Object.defineProperty(window,"lang",{writable:false,value:Object.freeze(await getTranslationMap())});
    Object.defineProperty(window,"langId",{writable:false,value:document.getElementsByTagName("html")[0].lang});
    Object.defineProperty(window,"app",{writable:false,value:await getApp(appId)});
    
});

window.f = {paramFetch, getApp}