import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, SUBJECTS_NAME, GRADE_LEVELS_NAME, APPROVAL_STATUSES_NAME, SUBJECTS, GRADE_LEVELS } from "../application.js";
import dom from "./dom.js";

var nameInput, urlInput, callback = {edit:async()=>{},del:async()=>{}};
function init () {
    for (var elt of document.getElementsByClassName("selectlist"))
        elt.callback = onEdit;
    nameInput = document.getElementById("name-in");
    urlInput = document.getElementById("url-in");
    for (var elt of document.querySelectorAll("#name-in,#url-in")) 
        elt.addEventListener("input",e=>onEdit());
    ;
    document.getElementById("delete-app-button").addEventListener("click",e=>{
        if (e.isTrusted) document.getElementById("confirm-delete-popup").classList.add("open");
    });
    document.getElementById("confirm-delete-button").addEventListener("click",async e=>{
        if (e.isTrusted) {
            await callback.del();
            window.location.pathname = "/";
        }
    });
    document.getElementById("cancel-delete-button").addEventListener("click",e=>{
        if (e.isTrusted) document.getElementById("confirm-delete-popup").classList.remove("open");
    });
}

function updateApp() {
    /**@type {Application}*/
    var app = window.app;
    app.setName(nameInput.value);
    app.setURL(urlInput.value);
    app.setStatus(dom.selectListElts[0].valueSingle(),dom.selectListElts[1].valueSingle());
    app.clearSubjects(); 
    app.clearGradeLevels(); 
    app.clearPlatforms(); 
    dom.selectListElts[2].value().filter(v=>v.value).map(v=>v.name).forEach(v=>app.addGradeLevel(v)); // grade
    dom.selectListElts[3].value().filter(v=>v.value).map(v=>v.name).forEach(v=>app.addSubject(v)); // subject
    dom.selectListElts[4].value().filter(v=>v.value).map(v=>v.name).forEach(v=>app.addPlatform(v)); // platform
}

function showSavingStatus(saved) {
    document.getElementById("issaved").innerText = dom.translate(saved?"editor.isSaved.saved":"editor.isSaved.saving");
    document.getElementById("issaved").classList.remove("warn");
    if (!saved) document.getElementById("issaved").classList.add("warn");
}

async function onEdit() {
    showSavingStatus(false);
    updateApp();
    await callback.edit();
    showSavingStatus(true);
}

export default { init, callback }