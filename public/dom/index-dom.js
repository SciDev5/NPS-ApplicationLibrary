import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, SUBJECTS_NAME, GRADE_LEVELS_NAME, APPROVAL_STATUSES_NAME, SUBJECTS, GRADE_LEVELS } from "../application.js";
import dom from "./dom.js";

var searchNameInput, last = {};
function init () {
    for (var elt of document.getElementsByClassName("selectlist"))
        elt.callback = onSearchDomUpdate;
    searchNameInput = document.getElementById("name-search");
    searchNameInput.addEventListener("input",e=>{
        if (!e.isTrusted) return;
        onSearchDomUpdate();
    });
}

function linkHttpsify(link) { return /https?:\/\//.test(link)?link:"https://"+link; }

function createAppDiv(/**@type {Application}*/app) {
    const translate = (key,map,mapName) => window.lang[mapName[map.indexOf(key)]]||key;
    const translateSingle = dom.translate;
    const moreInfoButton = dom.createElement("div",translateSingle("application.display.moreInfoButton"),{className:"more-info"});
    const editInfoButton = dom.createElement("a",translateSingle("application.display.editOrDelete"),{className:"edit-info",href:"/editor/"+app.id+"?lang="+window.langId});
    const moreInfoPopupCloseButton = dom.createElement("div",translateSingle("application.display.closeInfoPopup"),{className:"close"});
    //console.log(app.url,/.+/.test(app.url),/.+/.test(app.url)?dom.createElement("a",translateSingle("application.display.moreInfoUrl"),{href:linkHttpsify(app.url)}):null)
    const moreInfoPopup = dom.createElement("div",[
        dom.addPopupBGClickEvent(dom.createElement("div",[],{className:"bg"})),
        dom.createElement("div",[
            dom.createElement("div",[dom.createElement("div",app.name,{classList:"title-row-large"})],{classList:"grade-levels"}),
            dom.createElement("div",[dom.createElement("div",translateSingle("application.infoPopup.gradeLevels"),{classList:"title-row"})].concat(app.gradeLevels.map(v=>dom.createElement("div",translate(v,GRADE_LEVELS,GRADE_LEVELS_NAME),{classList:"row"}))),{classList:"grade-levels"}),
            dom.createElement("div",[dom.createElement("div",translateSingle("application.infoPopup.subjects"),{classList:"title-row"})].concat(app.subjects.map(v=>dom.createElement("div",translate(v,SUBJECTS,SUBJECTS_NAME),{classList:"row"}))),{classList:"subjects"}),
            dom.createElement("div",[dom.createElement("div",translateSingle("application.infoPopup.platforms"),{classList:"title-row"})].concat(app.platforms.map(v=>dom.createElement("div",translate(v,PLATFORMS,PLATFORMS_NAME),{classList:"row"}))),{classList:"platforms"}),
            /.+/.test(app.url)?dom.createElement("a",translateSingle("application.display.moreInfoUrl"),{href:linkHttpsify(app.url)}):null,
            moreInfoPopupCloseButton
        ],{className:"content"})
    ],{className:"more-info-popup"});
    moreInfoButton.addEventListener("click",e=>{if(e.isTrusted)moreInfoPopup.classList.add("open")});
    moreInfoPopupCloseButton.addEventListener("click",e=>{if(e.isTrusted)moreInfoPopup.classList.remove("open")});
    var appDiv = dom.createElement("div",[
        dom.createElement("div",app.name,{className:"name"}),
        dom.createElement("div",translate(app.approvalStatus,APPROVAL_STATUSES,APPROVAL_STATUSES_NAME),{className:"status as-"+app.approvalStatus}),
        dom.createElement("div",translate(app.privacyStatus,PRIVACY_STATUSES,PRIVACY_STATUSES_NAME),{className:"status ps-"+app.privacyStatus}),
        moreInfoButton,
        window.editor?editInfoButton:null,
        moreInfoPopup
    ],{className:"app"});
    return appDiv;
}

function getSearch() {
    var name = searchNameInput.value;
    var approvalStatus = dom.selectListElts[0].value().filter(v=>v.value).map(v=>APPROVAL_STATUSES.indexOf(v.name));
    var privacyStatus = dom.selectListElts[1].value().filter(v=>v.value).map(v=>PRIVACY_STATUSES.indexOf(v.name));
    var gradeLevels = dom.selectListElts[2].value().filter(v=>v.value).map(v=>GRADE_LEVELS.indexOf(v.name));
    var m = {};
    if (name) m.name = name.trim();
    if (approvalStatus && approvalStatus.length) m.approvalStatus = approvalStatus;
    if (privacyStatus && privacyStatus.length) m.privacyStatus = privacyStatus;
    if (gradeLevels && gradeLevels.length) m.gradeLevels = gradeLevels;
    m.gradeLevelsRequireAll = true;
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
    !compareArr(current.gradeLevels, last.gradeLevels)
}
function onSearchDomUpdate() {
    var changed = getSearchChanged();
    //console.log("SEARCH UPDATE ", changed);
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

export default {init,createAppDiv,onSearch,getSearch,getSearchChanged,onSearchEnd,populateApps,depopulateApps};