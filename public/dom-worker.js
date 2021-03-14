import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, SUBJECTS_NAME, GRADE_LEVELS_NAME, APPROVAL_STATUSES_NAME, SUBJECTS, GRADE_LEVELS } from "./application.js";

function createElement(type,content,params) {
    var elt = document.createElement(type);
    if (typeof(content)!="object"||!(content instanceof Array)) elt.innerText = content;
    else for (var subelt of content) elt.appendChild(subelt);
    for (var i in params) elt[i] = params[i];
    return elt;
}


function createAppDiv(/**@type {Application}*/app) {
    const translate = (key,map,mapName) => window.lang[mapName[map.indexOf(key)]]||key;
    var appDiv = createElement("div",[
        createElement("div",app.name,{className:"name"}),
        createElement("div",translate(app.approvalStatus,APPROVAL_STATUSES,APPROVAL_STATUSES_NAME),{className:"status as-"+app.approvalStatus}),
        createElement("div",translate(app.privacyStatus,PRIVACY_STATUSES,PRIVACY_STATUSES_NAME),{className:"status ps-"+app.privacyStatus}),
        createElement("div","P:"+app.platforms.map(v=>translate(v,PLATFORMS,PLATFORMS_NAME)).join(", "),{className:"platforms"}),
        createElement("div","S:"+app.subjects.map(v=>translate(v,SUBJECTS,SUBJECTS_NAME)).join(", "),{className:"subjects"}),
        createElement("div","G:"+app.gradeLevels.map(v=>translate(v,GRADE_LEVELS,GRADE_LEVELS_NAME)).join(", "),{className:"gradelevels"})
        //createElement("div",JSON.stringify({url:app.url,id:app.id}),{className:""})
    ],{className:"app"});
    return appDiv;
}

/**@type {(HTMLDivElement|{name:string,value:()=>{name:string,value:boolean}[]})[]}*/
var selectListElts = [], last = {};
function interactifySelectList(/**@type {HTMLDivElement|{name:string,value:()=>{name:string,value:boolean}[]}}*/selectListElt) {
    selectListElts.push(selectListElt);
    selectListElt.addEventListener("click",e=>{
        if (!e.isTrusted) return;

        /**@type {HTMLDivElement}}*/
        var cp = e.composedPath().filter(v=>v.classList&&v.classList.contains("selectlist-elt"))[0];
        if (cp) {
            if (cp.classList.contains("sel"))
                cp.classList.remove("sel");
            else cp.classList.add("sel");
            onSearchDomUpdate();
        } else {
            var doOpen = !selectListElt.classList.contains("open");
            selectListElt.classList.add("revanim");
            selectListElts.forEach(v=>v.classList.remove("open"));
                
            if (doOpen)
                selectListElt.classList.add("open");
            
        }
    });
    selectListElt.getElementsByClassName("selectlist-contents")[0].addEventListener("mouseleave",e=>{
        selectListElt.classList.add("revanim");
        selectListElts.forEach(v=>v.classList.remove("open"));
    });
    let se = selectListElt;
    selectListElt.value = ()=>{
        var elts = se.getElementsByClassName("selectlist-elt");
        var res = [];
        for (var elt of elts) res.push({name:elt.getAttribute("name"),value:elt.classList.contains("sel")});
        return res;
    };
    selectListElt.name = se.getAttribute("name");
}
addEventListener("click",e=>{
    if (!e.isTrusted) return;

    if (e.composedPath().filter(v=>v.classList&&v.classList.contains("selectlist")).length)
        return;
    selectListElts.forEach(v=>v.classList.remove("open"));
});

var searchNameInput;
addEventListener("load",e=>{
    for (var elt of document.getElementsByClassName("selectlist"))
        interactifySelectList(elt);
    searchNameInput = document.getElementById("name-search");
    searchNameInput.addEventListener("input",e=>{
        onSearchDomUpdate();
    });
});

function getSearch() {
    var name = searchNameInput.value;
    var approvalStatus = selectListElts[0].value().filter(v=>v.value).map(v=>APPROVAL_STATUSES.indexOf(v.name));
    var privacyStatus = selectListElts[1].value().filter(v=>v.value).map(v=>PRIVACY_STATUSES.indexOf(v.name));
    var platforms = selectListElts[2].value().filter(v=>v.value).map(v=>PLATFORMS.indexOf(v.name));
    var m = {};
    if (name) m.name = name.trim();
    if (approvalStatus && approvalStatus.length) m.approvalStatus = approvalStatus;
    if (privacyStatus && privacyStatus.length) m.privacyStatus = privacyStatus;
    if (platforms && platforms.length) m.platforms = platforms;
    return m;
}
function compareArr(a,b) {
    if (a == null && b == null) return true;
    if (a == null && b != null || a != null && b == null) return false;
    if (a.length != b.length) return false;
    return a.map((_,i)=>a[i]==b[i]).filter(v=>!v).length==0;
}
function getSearchChanged() {
    var current = getSearch();
    return current.name != last.name || 
    !compareArr(current.approvalStatus, last.approvalStatus) || 
    !compareArr(current.privacyStatus, last.privacyStatus) ||
    !compareArr(current.platforms, last.platforms)
}
function onSearchDomUpdate() {
    var changed = getSearchChanged();
    console.log("SEARCH UPDATE ", changed);
    var srp = document.getElementById("search-refresh-popup");
    if (changed)
        srp.classList.add("open");
    else srp.classList.remove("open");
    document.getElementById("search-refresh-button-inline").disabled = !changed;
}
function onSearch() {
    last = getSearch();
    onSearchDomUpdate();
    document.getElementById("search-loading-popup").classList.add("open");
    depopulateApps();
}
function onSearchEnd(apps) {
    document.getElementById("search-loading-popup").classList.remove("open");
    document.getElementById("search-refresh-button-inline").disabled = true;
    populateApps(apps);
}
function depopulateApps() {
    var appContainer = document.getElementById("apps-list");
    var destroyedAppDomElts = [];
    for (var elt of appContainer.children) if (elt.id!="apps-empty") destroyedAppDomElts.push(elt);
    for (var elt of destroyedAppDomElts) elt.remove();
}
function populateApps(apps) {
    var appContainer = document.getElementById("apps-list");
    var emptyText = document.getElementById("apps-empty");
    if (apps.length == 0) emptyText.classList.add("visible");
    else emptyText.classList.remove("visible");
    for (var i = 0; i < apps.length; i++)
        appContainer.appendChild(createAppDiv(apps[i]));
}

export default {createAppDiv,onSearch,getSearch,getSearchChanged,onSearchEnd,populateApps,depopulateApps};