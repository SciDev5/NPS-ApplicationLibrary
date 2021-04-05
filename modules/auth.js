function authenticateEdit(req) {
    return !!getSignedInAdmin(req);
}


function signinAdmin(id, req) { req.session.userId = id; }
function signoutAdmin(res) { res.clearCookie("admin_session"); }
function getSignedInAdmin(req) { return req.session.userId; }

export default {authenticateEdit,signinAdmin,signoutAdmin,getSignedInAdmin};