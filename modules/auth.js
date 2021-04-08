import bcrypt from "bcrypt";
import database from "./db-handler.js";

const ADMIN_TOKENS = [];
const SALT_ROUNDS = 10;

function authenticateEdit(req) {
    return !!getSignedInAdmin(req);
}


async function authCredentials(username, password) {
    var infoByUsername = await database.admin.getByUsername(username);

    // TODO: CHECK PASSWORD

    if (infoByUsername) return infoByUsername["id"];
    else return null;
}
async function createAccount(token,username, password) {
    if (!await checkAdminAccountToken(token)) return null;
    var hashedpass = new Promise((res,rej)=>bcrypt.hash(password,SALT_ROUNDS,(err,data)=>{ if (err) rej(err); else res(data); }));
    return await database.admin.add(username,hashedpass);
}
async function createAdminAccountToken() {
    var token = ""; for (var i = 0; i < 64; i++) token += "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-_"[Math.floor(Math.random()*64)];
    ADMIN_TOKENS.push(token);
    return token;
}
async function checkAdminAccountToken(token) {
    if (!ADMIN_TOKENS.includes(token)) return false;
    ADMIN_TOKENS.splice(ADMIN_TOKENS.indexOf(token),1);
    return true;
}

function signinAdmin(id, req) { req.session.userId = id; }
function signoutAdmin(res) { res.clearCookie("admin_session"); }
function getSignedInAdmin(req) { return req.session.userId; }

export default {authenticateEdit,signinAdmin,signoutAdmin,getSignedInAdmin,authCredentials,createAccount,createAdminAccountToken};