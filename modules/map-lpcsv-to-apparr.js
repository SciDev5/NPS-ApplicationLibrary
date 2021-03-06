import fs from "fs";
import {APPROVAL_STATUSES,PRIVACY_STATUSES,Application} from "../public/application.js";

const APPROVAL_STATUS_NAME_MAP = {"Unknown":0,"Approved for Use":1,"Student must be 14+ with parent consent to create account":2,"Requires Parental/Custodian Informed Consent":3,"Active Pilot":4,"Instructional Use Only":5,"Pending":6,"Reviewed & Denied":7}
const PRIVACY_STATUS_NAME_MAP = {"Unknown":0,"Compliant":1,"Noncompliant":2,"Parent consent required":3,"Teacher Instructional Use Only":4,"No Personal Information Collected":5,"Not applicable":6}

function getLPCSV_test() {
    return fs.readFileSync("./.data/lp_apps.csv",{encoding:"utf-8"});
}

function convertLPCSV(lp_csv) {
    var s = lp_csv.trim();
    s = s.split("\n").map(v=>v.trim().split(",")); 
    s.splice(0,1);
    s = s.map(v=>({name:v[0],approval:v[5],privacy:v[6]}));
    s = s.map(v=>({
        name:v.name,
        approval:APPROVAL_STATUSES[APPROVAL_STATUS_NAME_MAP[v.approval]],
        privacy:PRIVACY_STATUSES[PRIVACY_STATUS_NAME_MAP[v.privacy]]
    }));
    s = s.map(v=>new Application({tags:[],platforms:[],name:v.name,approvalStatus:v.approval,privacyStatus:v.privacy}));
    return s;
}

export default {convertLPCSV,getLPCSV_test};