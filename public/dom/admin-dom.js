import dom from "./dom.js";


function isEditor() { return window["editor"]; }

var callback = {signup:async(username,password)=>{return false},signin:async(username,password)=>{return false},signout:async()=>{}};
async function init() {
    var editor = window["editor"], signupCode = window["signupCode"];
    var signXButton = document.getElementById("sign-button");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    console.log(username,password);
    if (editor) {
        signXButton.addEventListener("click",async e=>{
            if (!e.isTrusted) return;
            await callback.signout();
        });
    } else if (signupCode) {
        signXButton.addEventListener("click",async e=>{
            if (!e.isTrusted) return;
            await callback.signup(username.value,password.value);
        });
    } else {
        signXButton.addEventListener("click",async e=>{
            if (!e.isTrusted) return;
            await callback.signin(username.value,password.value);
        });
    }
}


export default { init, callback }