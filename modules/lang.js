import fs from "fs";

const DEFAULT_LANG = "en_us";

async function getTranslationMap(lang) {
    var data = await new Promise((res,rej)=>fs.readFile(`./assets/lang/${lang}.txt`,{encoding:"utf-8"},(err,str)=>{
        if (err) rej(err);
        else res(str);
    }));
    data = data.trim().split("\n").map(v=>v.includes("#")?v.substr(0,v.indexOf("#")):v).filter(v=>!!v.trim()).map(v=>[v.substr(0,v.indexOf("=")).trim(),v.substr(v.indexOf("=")+1).trim()]);
    var map = {};
    data.forEach(v=>map[v[0]]=v[1]);
    return map;
}

export {getTranslationMap,DEFAULT_LANG};