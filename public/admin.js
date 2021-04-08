import dom from "./dom/dom.js";
import adminDom from "./dom/admin-dom.js";
import { paramFetchPost } from "./web/requests.js";


function checkCredentialsPresent(username, password) {
    if (!username || !password) { 
        alert(dom.translate("admin.errorMissingCredentials")); 
        return true; 
    }
    return false;
}

async function signup(username, password) {
    try {
        if (checkCredentialsPresent(username,password)) return;
        var res = await paramFetchPost("/admin/signup",{username,password,code:signupCode});
        if (res.success)
            window.location.reload();
        else 
            alert(dom.translate("admin.signupFailedMessage"));
    } catch (e) {
        alert(dom.translate("admin.signinError")+"\n"+e.stack);
        console.error(e);
    }
}
async function signin(username, password) {
    try {
        if (checkCredentialsPresent(username,password)) return;
        var res = await paramFetchPost("/admin/signin",{username,password});
        if (res.success)
            window.location.reload();
        else 
            alert(dom.translate("admin.signinFailedMessage"));
    } catch (e) {
        alert(dom.translate("admin.signinError")+"\n"+e.stack);
        console.error(e);
    }
}
async function signout() {
    try {
        var res = await paramFetchPost("/admin/signout");
        window.location.reload();
    } catch (e) {
        alert(dom.translate("admin.signinError")+"\n"+e.stack);
        console.error(e);
    }
}

var signupCode = null;
addEventListener("load",async e=>{
    await dom.init();
    Object.defineProperty(window,"editor",{writable:false,value:!!document.getElementsByTagName("html")[0].getAttribute("editor")});
    Object.defineProperty(window,"signupCode",{writable:false,value:!!document.getElementsByTagName("html")[0].getAttribute("code")}); signupCode = window["signupCode"];
    adminDom.callback.signin = signin;
    adminDom.callback.signout = signout;
    adminDom.callback.signup = signup;
    await adminDom.init();

    var queryParams = new URLSearchParams(window.location.search);
    queryParams.delete("signup-code");
    window.history.replaceState(null,document.title,"/admin?"+queryParams.toString());
    //todo
});