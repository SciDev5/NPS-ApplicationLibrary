import bcrypt from "bcrypt";
import database from "./db-handler.js";

const ADMIN_TOKENS = [];
const SALT_ROUNDS = 10;
const EXPIRE_TIME = 7*24*60*60*1000;
var adminExists = false;

async function isNoAdmins() {
    if (adminExists) return false;
    adminExists = await database.admin.anyExists();
    return !adminExists;
}

async function authCredentials(username, password) {
    var userData = await database.admin.getByUsername(username);

    if (userData) {
        var passIsCorrect = await new Promise((res,rej)=>bcrypt.compare(password,userData["hashedpass"],(err,data)=>{ if (err) rej(err); else res(data); }));
        if (passIsCorrect)
            return userData["id"];
    } else return null;
}
async function createAccount(token,username,password) {
    if (!await checkAdminAccountToken(token)) return null;
    var hashedpass = await new Promise((res,rej)=>bcrypt.hash(password,SALT_ROUNDS,(err,data)=>{ if (err) rej(err); else res(data); }));
    console.log("CREATED ACCOUNT",username,hashedpass,"[ TOKEN:",token,"]");
    return await database.admin.add(username,hashedpass);
}

async function createAdminAccountToken() {
    var token = ""; for (var i = 0; i < 64; i++) token += "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-_"[Math.floor(Math.random()*64)];
    ADMIN_TOKENS.push({expires:new Date(new Date().getTime()+EXPIRE_TIME),token});
    return token;
}
function pruneTokens() {
    const now = new Date();
    for (var i = ADMIN_TOKENS.length-1; i >= 0; i--)
        if (now > ADMIN_TOKENS[i].expires) ADMIN_TOKENS.splice(i,1);
}
async function checkAdminAccountToken(token) {
    pruneTokens(); var tokenStrings = ADMIN_TOKENS.map(v=>v.token);
    if (!tokenStrings.includes(token)) return false;
    ADMIN_TOKENS.splice(tokenStrings.indexOf(token),1);
    return true;
}

function signinAdmin(id, req) { req.session.userId = id; }
function signoutAdmin(res) { res.clearCookie("admin_session"); }
function getSignedInAdmin(req) { return req.session.userId; }

export default {isNoAdmins,signinAdmin,signoutAdmin,getSignedInAdmin,authCredentials,createAccount,createAdminAccountToken};