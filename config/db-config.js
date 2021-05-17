module.exports = {
    "development": {
        "username": process.env.PG_USER,
        "password": process.env.PG_PASSWORD,
        "database": process.env.PG_DATABASE,
        "host": process.env.PG_HOST,
        "port": process.env.PG_PORT,
        "dialect": "postgres",
        "operatorsAliases": false
    },
    "test": {
        "username": process.env.PG_USER,
        "password": process.env.PG_PASSWORD,
        "database": process.env.PG_DATABASE,
        "host": process.env.PG_HOST,
        "port": process.env.PG_PORT,
        "dialect": "postgres",
        "operatorsAliases": false
    },
    "production": {
        "use_env_variable": "DATABASE_URL",
        "dialect": "postgres",
        "operatorsAliases": false
    }
}
  