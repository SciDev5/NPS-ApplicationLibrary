function createElement(type,content,params) {
    var elt = document.createElement(type);
    if (typeof(content)!="object"||!(content instanceof Array)) elt.innerText = content;
    else for (var subelt of content) if (subelt) elt.appendChild(subelt);
    for (var i in params) elt[i] = params[i];
    return elt;
}

function addPopupBGClickEvent(elt) {
    elt.addEventListener("click",e=>{if(e.isTrusted)e.path[1].classList.remove("open")});
    return elt;
}

function translate(key) {
    return window.lang[key]||key;
}

/**@type {(HTMLDivElement&{name:string,valueSingle:()=>string,value:()=>{name:string,value:boolean}[]})[]}*/
var selectListElts = [];
function interactifySelectList(/**@type {HTMLDivElement&{callback:()=>void,name:string,valueSingle:()=>string,value:()=>{name:string,value:boolean}[]}}*/selectListElt) {
    selectListElts.push(selectListElt);
    var options = selectListElt.getElementsByClassName("selectlist-elt"), useMany = !!selectListElt.getAttribute("many"), initState = JSON.parse(selectListElt.getAttribute("initialstate"));
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
            if (selectListElt.callback) selectListElt.callback();
            else console.log("Callback unbound: ",selectListElt);
        } else if (!selectListElt.querySelector(".selectlist-contents:hover")) {
            var doOpen = !selectListElt.classList.contains("open");
            selectListElt.classList.add("revanim");
            selectListElts.forEach(v=>v.classList.remove("open"));
                
            if (doOpen)
                selectListElt.classList.add("open");
            
        }
    });
    
    selectListElt.getElementsByClassName("selectlist-contents")[0].addEventListener("mouseleave",async e=>{
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

addEventListener("load",e=>{
    for (var elt of document.getElementsByClassName("selectlist"))
        interactifySelectList(elt);

    const lc = document.getElementById("language-container");
    document.querySelector(".language-list > .language-option:nth-child(1)").addEventListener("click",e=>{
        lc.classList.remove("open");
    });
    document.getElementById("translate-button").addEventListener("click",e=>{
        lc.classList.add("open");
    });
    
    for (var elt of document.querySelectorAll(".bg")) addPopupBGClickEvent(elt);
    for (var elt of document.querySelectorAll(".language-list > .language-option:not(:nth-child(1))"))
        elt.addEventListener("click",e=>{
            var srch = new URLSearchParams(window.location.search);
            srch.set("lang",e.path[0].getAttribute("value"));
            window.location.search = srch.toString();
        });

});


export default {createElement,selectListElts,translate,addPopupBGClickEvent};