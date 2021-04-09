import dom from "./dom.js";


function isEditor() { return window["editor"]; }

var callback = {signup:async(username,password)=>{return false},signin:async(username,password)=>{return false},signout:async()=>{},createToken:async()=>{}};
async function init() {
    var editor = window["editor"], signupCode = window["signupCode"];
    var signXButton = document.getElementById("sign-button");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    var createTokenButton = document.getElementById("create-admin-token-button");
    if (editor) {
        signXButton.addEventListener("click",async e=>{
            if (!e.isTrusted) return;
            await callback.signout();
        });
        createTokenButton.addEventListener("click",async e=>{
            if (!e.isTrusted) return;
            await callback.createToken();
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