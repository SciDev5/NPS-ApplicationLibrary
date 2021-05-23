import Sequelize from "sequelize";
import { Application, APPROVAL_STATUSES, GRADE_LEVELS, PLATFORMS, PRIVACY_STATUSES, SUBJECTS } from "../public/application.js";
import Admin from "./db-models/Admin.js";
import App from "./db-models/AppEntry.js";
import { isStringInArray, isStringArrayInArray } from "./utils.js";
import lpcsvUtil from "./map-lpcsv-to-apparr.js";
const { Op } = Sequelize;

function App_modelToClass(v) {
    return new Application({
        id: v.id,
        name: v.name,
        approval: v.approval,
        privacy: v.privacy,
        platforms: v.platforms,
        grades: v.grades,
        subjects: v.subjects,
        url: v.url
    });
}

async function App_all() {
    return (await App.findAll()).map(App_modelToClass);
}
async function App_search(query) { 
    var {name,approval,privacy,platforms,platformsRequireAll,grades,gradeLevelsRequireAll,subjects,subjectsRequireAll} = query;
    var where = {};
    if (name && typeof(name)==="string") 
        where.name = Sequelize.where(Sequelize.fn("LOWER",Sequelize.col("App.name")), Op.like, `%${name.toLowerCase()}%` );
    if (isStringArrayInArray(APPROVAL_STATUSES, approval)) where.approval = { [Op.in]: approval };
    if (isStringArrayInArray(PRIVACY_STATUSES, privacy)) where.privacy = { [Op.in]: privacy };
    if (isStringArrayInArray(PLATFORMS, platforms)) where.platforms = {[Op.contains]:platforms};
    if (isStringArrayInArray(GRADE_LEVELS, grades)) where.grades = {[Op.contains]:grades};
    if (isStringArrayInArray(SUBJECTS, subjects)) where.subjects = {[Op.contains]:subjects};
    return (await App.findAll({where})).map(App_modelToClass);
}
async function App_make(query) {
    var {name,approval,privacy,platforms,grades,subjects} = query;
    var value = {};
    if (name && typeof(name)==="string")              value.name = name;
    if (isStringInArray(APPROVAL_STATUSES, approval)) value.approval = approval;
    if (isStringInArray(PRIVACY_STATUSES, privacy))   value.privacy = privacy;
    if (isStringArrayInArray(PLATFORMS, platforms))   value.platforms = platforms;
    if (isStringArrayInArray(GRADE_LEVELS, grades))   value.grades = grades;
    if (isStringArrayInArray(SUBJECTS, subjects))     value.subjects = subjects;
    return (await App.create(value)).id;
}
async function App_get(id) {
    return App_modelToClass(await App.findByPk(id));
}
async function App_del(id) {
    await (await App.findByPk(id)).destroy();
}
async function App_update(id,query) {
    var {name,approval,privacy,platforms,grades,subjects,url} = query;
    var appData = {};
    if (name && typeof(name)==="string")              appData.name = name;
    if (typeof(url)==="string")                       appData.url = url;
    if (isStringInArray(APPROVAL_STATUSES, approval)) appData.approval = approval;
    if (isStringInArray(PRIVACY_STATUSES, privacy))   appData.privacy = privacy;
    if (isStringArrayInArray(PLATFORMS, platforms))   appData.platforms = platforms;
    if (isStringArrayInArray(GRADE_LEVELS, grades))   appData.grades = grades;
    if (isStringArrayInArray(SUBJECTS, subjects))     appData.subjects = subjects;
    var app = (await App.update(appData,{where:{id}}))[1][0];
    return App_modelToClass(app);
}

async function Admin_getByUsername(username) {
    return await Admin.findOne({name:username});
}
async function Admin_add(username,hashedpass) {
    return (await Admin.create({username,hashedpass})).id;
}
async function Admin_anyExists() {
    return (await Admin.findOne()) != null;
}

async function Destroy() {
    await App.destroy({where:{}});
}

(async()=>{ // TODO replace with better system
    if ((await App.findOne()) == null) {
        var apps = lpcsvUtil.convertAppsCSV(lpcsvUtil.getAppsCSV()).map(v=>v.toJSON(true,true));
        await App.bulkCreate(apps,{});
    }
})().catch(e=>{throw e});

const dbNew = {
    apps: {
        search: App_search,
        add: App_make,
        getAll: App_all,
        get: App_get,
        del: App_del,
        update: App_update,
        destroy: Destroy
    },
    admin: {
        getByUsername: Admin_getByUsername,
        add: Admin_add,
        anyExists: Admin_anyExists
    }
}
export default dbNew;