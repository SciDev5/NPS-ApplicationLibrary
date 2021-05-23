import Sequelize from "sequelize";
import Admin from "./db-models/Admin.js";
import App from "./db-models/AppEntry.js";
import sequelize from "./sequelize.js";


async function App_all() {
    var apps = await App.findAll();
    return apps;
}
async function App_search(query) { 
    var {name,approvalStatus,privacyStatus,platforms,platformsRequireAll,gradeLevels,gradeLevelsRequireAll,subjects,subjectsRequireAll} = query;
    var apps = await App.findAll({where:{
        name: sequelize.where(sequelize.fn("LOWER", Sequelize.col("name")), "LIKE", "%"+sequelize.escape(name.toLowerCase())+"%")
    }});
    console.log(apps);
    return apps;
}
async function App_make(query) {
    var {name,approvalStatus,privacyStatus,platforms,platformsRequireAll,gradeLevels,gradeLevelsRequireAll,subjects,subjectsRequireAll} = query;
    var app = await App.create({name});
    console.log(app);
    return app;
}

const dbNew = {
    app: {
        search: App_search,
        make: App_make,
        all: App_all
    }
}
export default dbNew;