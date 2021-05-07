/**
var usp = new URLSearchParams(window.location.search);
if (!usp.get("lang")) {
    usp.set("lang",(navigator.language||"en_us").replace(/-/g,"_").toLowerCase())
    window.location.replace(window.location.pathname+"?"+usp.toString());
}
*/