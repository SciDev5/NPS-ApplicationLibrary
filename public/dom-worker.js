import { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS } from "./application.js" 

function createElement(type,content,params) {
    var elt = document.createElement(type);
    if (typeof(content)=="string") elt.innerText = content;
    else for (var subelt of content) elt.appendChild(subelt);
    for (var i in params) elt[i] = params[i];
    return elt;
}


function createAppDiv(/**@type {Application}*/app) {
    console.log(app);
    var appDiv = createElement("div",[
        createElement("h1",app.name,{className:"name"}),
        createElement("p",JSON.stringify(app.tags),{className:"tags"}),
        createElement("p",app.approvalStatus,{className:"status"}),
        createElement("p",app.privacyStatus,{className:"status"}),
        createElement("p",app.platforms.join(", "),{className:"platforms"}),
        createElement("p",JSON.stringify({url:app.url,id:app.id}),{className:""})
    ],{id:"app"});
    return appDiv;
}

export default {createAppDiv};