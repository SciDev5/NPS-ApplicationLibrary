import { Application } from "./application.js";
import dom from "./dom/dom.js";
import editorDom from "./dom/editor-dom.js";
import { paramFetch, paramFetchPost } from "./web/requests.js";

async function getApp(id) {
    return Application.parse(await (await fetch("/apps/get/"+id)).json());
}

async function updateApp() {
    return await paramFetchPost("/apps/edit/"+window.appId,window.app.toJSON());
}
async function deleteApp() {
    return await paramFetchPost("/apps/del/"+window.appId);
}

addEventListener("load",async e=>{
    await dom.init();
    editorDom.init();
    editorDom.callback.edit = updateApp;
    editorDom.callback.del = deleteApp;
    var appId = window.location.pathname.split("/")[2];
    window.appId = appId;
    Object.defineProperty(window,"app",{writable:false,value:await getApp(appId)});
    
});

window.f = {paramFetch, getApp}