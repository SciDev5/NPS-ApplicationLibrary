import fs from "fs";
import { deepFreeze } from "./utils.js";

const DEFAULT_LANG = "en_us";
const ALL_LANGS = ["en_us","es"];

const translationMapCache = {};

async function getTranslationMap(lang) {
    if (lang in translationMapCache) return translationMapCache[lang];
    try {
        var data = await new Promise((res,rej)=>fs.readFile(`./assets/lang/${lang}.txt`,{encoding:"utf-8"},(err,str)=>{
            if (err) rej(err);
            else res(str);
        }));
    } catch (e) { return {}; }
    data = data.trim().split("\n").map(v=>v.includes("#")?v.substr(0,v.indexOf("#")):v).filter(v=>!!v.trim()).map(v=>[v.substr(0,v.indexOf("=")).trim(),v.substr(v.indexOf("=")+1).trim()]);
    var map = {};
    data.forEach(v=>map[v[0]]=v[1]);

    translationMapCache[lang] = map;
    return map;
}

/**@type {{name:string,lang:string}[]}*/
const LANGUAGE_INTERNAL_NAMES = [];
const LANGUAGE_INTERNAL_NAMES_READY = (async ()=>{
    var z = ALL_LANGS.map(async v=>({lang:v,name:(await getTranslationMap(v))["lang"]}));
    await Promise.all(z);
    for (var lm of z)
        LANGUAGE_INTERNAL_NAMES.push(await lm);
    deepFreeze([ALL_LANGS,LANGUAGE_INTERNAL_NAMES]);
})();

export {getTranslationMap,DEFAULT_LANG,LANGUAGE_INTERNAL_NAMES,LANGUAGE_INTERNAL_NAMES_READY,ALL_LANGS};