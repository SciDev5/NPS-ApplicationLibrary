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
    const translateSingle = (key) => window.lang[key]||key;
    const moreInfoButton = createElement("div",translateSingle("application.display.moreInfoButton"),{className:"more-info"});
    const moreInfoPopupCloseButton = createElement("div",translateSingle("application.display.closeInfoPopup"),{className:"close"});
    const moreInfoPopup = createElement("div",[
        createElement("div",[],{className:"bg"}),
        createElement("div",[
            createElement("p",app.gradeLevels.map(v=>translate(v,GRADE_LEVELS,GRADE_LEVELS_NAME)).join(),{}),
            createElement("p",app.subjects.map(v=>translate(v,SUBJECTS,SUBJECTS_NAME)).join(),{}),
            createElement("p",app.platforms.map(v=>translate(v,PLATFORMS,PLATFORMS_NAME)).join(),{}),
            createElement("a",translateSingle("application.display.moreInfoUrl"),{href:app.url}),
            createElement("a",translateSingle("application.display.editOrDelete"),{href:"/editor/"+app.id+"?lang="+window.langId}),
            moreInfoPopupCloseButton
        ],{className:"content"})
    ],{className:"more-info-popup"});
    moreInfoButton.addEventListener("click",e=>{if(e.isTrusted)moreInfoPopup.classList.add("open")});
    moreInfoPopupCloseButton.addEventListener("click",e=>{if(e.isTrusted)moreInfoPopup.classList.remove("open")});
    var appDiv = createElement("div",[
        createElement("div",app.name,{className:"name"}),
        createElement("div",translate(app.approvalStatus,APPROVAL_STATUSES,APPROVAL_STATUSES_NAME),{className:"status as-"+app.approvalStatus}),
        createElement("div",translate(app.privacyStatus,PRIVACY_STATUSES,PRIVACY_STATUSES_NAME),{className:"status ps-"+app.privacyStatus}),
        moreInfoButton,
        moreInfoPopup
    ],{className:"app"});
    return appDiv;
}

/**@type {(HTMLDivElement|{name:string,value:()=>{name:string,value:boolean}[]})[]}*/
var selectListElts = [], last = {};
function interactifySelectList(/**@type {HTMLDivElement|{name:string,value:()=>{name:string,value:boolean}[]}}*/selectListElt) {
    selectListElts.push(selectListElt);
    var options = selectListElt.getElementsByClassName("selectlist-elt"), useMany = !!selectListElt.getAttribute("many"), initState = JSON.parse(selectListElt.getAttribute("initialstate"));
    console.log(initState)
    if (useMany && (initState instanceof Array)) {
        for (var state of initState)
            options[state].classList.add("sel");
    } else if (!useMany && Number.isInteger(initState)) {
        options[initState].classList.add("sel");
    }
    selectListElt.addEventListener("click",e=>{
        if (!e.isTrusted) return;

        /**@type {HTMLDivElement}}*/
        var cp = e.composedPath().filter(v=>v.classList&&v.classList.contains("selectlist-elt"))[0];
        if (cp) {
            if (useMany) {
                if (cp.classList.contains("sel"))
                    cp.classList.remove("sel");
                else cp.classList.add("sel");
            } else {
                for (var elt of options) elt.classList.remove("sel");
                cp.classList.add("sel");
            }
            if (handleSearch) onSearchDomUpdate();
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
    selectListElt.valueSingle = ()=>{
        var v = selectListElt.value().filter(z=>z.value);
        return v[0].name;
    };
    selectListElt.name = se.getAttribute("name");
}
addEventListener("click",e=>{
    if (!e.isTrusted) return;

    if (e.composedPath().filter(v=>v.classList&&v.classList.contains("selectlist")).length)
        return;
    selectListElts.forEach(v=>v.classList.remove("open"));
});

var searchNameInput, handleSearch = false;
addEventListener("load",e=>{
    for (var elt of document.getElementsByClassName("selectlist"))
        interactifySelectList(elt);
    searchNameInput = document.getElementById("name-search");
    handleSearch = !!searchNameInput;
    if (handleSearch) searchNameInput.addEventListener("input",e=>{
        onSearchDomUpdate();
    });

    const lc = document.getElementById("language-container");
    document.querySelector(".language-list > .language-option:nth-child(1)").addEventListener("click",e=>{
        lc.classList.remove("open");
    });
    document.getElementById("translate-button").addEventListener("click",e=>{
        lc.classList.add("open");
    });
    for (var elt of document.querySelectorAll(".language-list > .language-option:not(:nth-child(1))"))
        elt.addEventListener("click",e=>{
            var srch = new URLSearchParams(window.location.search);
            srch.set("lang",e.path[0].getAttribute("value"));
            window.location.search = srch.toString();
        });

});

function getSearch() {
    var name = searchNameInput.value;
    var approvalStatus = selectListElts[0].value().filter(v=>v.value).map(v=>APPROVAL_STATUSES.indexOf(v.name));
    var privacyStatus = selectListElts[1].value().filter(v=>v.value).map(v=>PRIVACY_STATUSES.indexOf(v.name));
    var gradeLevels = selectListElts[2].value().filter(v=>v.value).map(v=>GRADE_LEVELS.indexOf(v.name));
    var m = {};
    if (name) m.name = name.trim();
    if (approvalStatus && approvalStatus.length) m.approvalStatus = approvalStatus;
    if (privacyStatus && privacyStatus.length) m.privacyStatus = privacyStatus;
    if (gradeLevels && gradeLevels.length) m.gradeLevels = gradeLevels;
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