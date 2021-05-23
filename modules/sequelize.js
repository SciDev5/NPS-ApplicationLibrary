import {Sequelize} from "sequelize";

var sequelize = new Sequelize(process.env.DATABASE_URL, {dialectOptions:{ssl:{require:true, rejectUnauthorized: false}},dialect:"postgres"});

export default sequelize;