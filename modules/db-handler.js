const sqlite = require("sqlite3").verbose();
const testDB = new sqlite.Database(":memory:");

const TABLE_NAME = "TestTable";
const TABLE_COLS = [{name:"test", type:"TEXT", notNull:true, primaryKey:false}, {name:"inttest", type:"INT"}];

function tableColsStr(cols) {
    var slst = [];
    for (var col of cols) {
        var clst = [col.name,col.type];
        if (col.notNull) clst.push("NOT NULL");
        if (col.primaryKey) clst.push("PRIMARY KEY");
        slst.push(clst.join(" "));
    }
    return "("+slst.join(", ")+")";
}
/*
function compareTableCols(a,b) {
    var namesA = {}, namesB = {};
    for (var col of a) namesA[cpl.name] = col;
    for (var col of b) namesB[col.name] = col;
    var inANotB = [], inBNotA = [], mismatches = [];
    for (var n in a) {
        if (!(n in b)) inANotB.push(a[n]);
        else if (!colInfoMatches(a[n],b[n])) mismatches = a[n];
    }
}*/

function tryInitDB() {
    return new Promise((res,rej)=>{
        testDB.run("CREATE TABLE IF NOT EXISTS "+TABLE_NAME+" "+tableColsStr(TABLE_COLS),(err)=>{
            if (err) rej(err);
            else res();
        })
    });
}
/*
async function updateDBCols() {
    var existingColsRaw = await new Promise((res,rej)=>{
        testDB.all("PRAGMA table_info("+TABLE_NAME+")",(err,data)=>{
            if (err) rej(err);
            res(data);
        })
    });
    var existingCols = [];
    for (var colRaw of existingColsRaw)
        existingCols.push({name:colRaw.name,type:colRaw.type,notNull:colRaw.notnull==1,primaryKey:colRaw.pk==1});
    console.log(existingCols);
}*/

tryInitDB();
//updateDBCols();

(async()=>{
    await new Promise(res=>setTimeout(()=>{testDB.close();res()},4000));
})();