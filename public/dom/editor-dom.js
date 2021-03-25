import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, PRIVACY_STATUSES_NAME, PLATFORMS_NAME, SUBJECTS_NAME, GRADE_LEVELS_NAME, APPROVAL_STATUSES_NAME, SUBJECTS, GRADE_LEVELS } from "../application.js";
import dom from "./dom.js";
const {createElement,selectListElts} = dom;

var nameInput, urlInput, callback = {v:async()=>{}};
function init () {
    for (var elt of document.getElementsByClassName("selectlist"))
        elt.callback = onEdit;
    nameInput = document.getElementById("p-name");
    urlInput = document.getElementById("p-url");
    for (var elt of document.querySelectorAll("#p-name,#p-url")) 
        elt.addEventListener("input",e=>onEdit());
}

function showSavingStatus(saved) {
    document.getElementById("issaved").innerText = dom.translate(saved?"editor.isSaved.saved":"editor.isSaved.saving");
    document.getElementById("issaved").classList.remove("warn");
    if (!saved) document.getElementById("issaved").classList.add("warn");
}

async function onEdit() {
    showSavingStatus(false);
    await callback.v();
    showSavingStatus(true);
}

export default { init, callback }