const APPROVAL_STATUSES = ["UNK","APPROVED","14_PARENTAL_CONSENT","PARENT_INFORMED","PILOT","INSTRUCTOR_ONLY","PENDING","DENIED"];
const PRIVACY_STATUSES = ["UNK","COMPLIANT","NONCOMPLIANT","PARENTAL_CONSENT","INSTRUCTOR_ONLY","NO_INFO_COLLECTED","NOT_APPLICABLE"];
const PLATFORMS = ["WINDOWS","MACOS","LINUX","ANDROID_PHONE","ANDROID_TABLET","IOS_PHONE","IOS_TABLET","WEB","CHROMEBOOK"]

const APPROVAL_STATUSES_NAME = ["Unknown","Approved","14 w/ Parental Consent","Parent Informed Use","Active Pilot","Instructor Use Only","Pending","Reviewed and Denied"];
const PRIVACY_STATUSES_NAME = ["Unknown","Compliant","Noncompliant","Parental Consent Required","Instructor Use Only","No Information Collected","Not Applicable"];
const PLATFORMS_NAME = ["Windows","Macos","Linux","Android Phone","Android Tablet","iPhone","iPad","Web","Chromebook"]


class Application {
    constructor(/** @type {{id?:number,name:string,platforms:string[],url?:string,approvalStatus:string,privacyStatus:string}} */ obj) {
        var {id,name,platforms,url,approvalStatus,privacyStatus} = obj;
        this.id = id;
        this.name = name || "unnamed";
        this.url = url || "";
        this.platforms = platforms || [];
        this.approvalStatus = approvalStatus || APPROVAL_STATUSES[0];
        this.privacyStatus = privacyStatus || APPROVAL_STATUSES[0];
    }
    static parse(/** @type {{id:number,name:string,platforms:string|number[],url:string,approvalStatus:number,privacyStatus:number}} */ obj) {
        var {id,name,platforms,url,approvalStatus,privacyStatus} = obj;
        if (typeof(platforms)=="string") platforms = platforms.split(",").map(v=>PLATFORMS[v]).filter(v=>v);
        return new Application({id,url,name,platforms,approvalStatus:APPROVAL_STATUSES[approvalStatus],privacyStatus:PRIVACY_STATUSES[privacyStatus]});
    }
    

    addPlatform(platform) {
        if (PLATFORMS.includes(platform) && !this.platforms.includes(platform)) this.platforms.push(platform);
    }
    removePlatform(platform) {
        var i = this.platforms.indexOf(platform);
        if (i != -1) this.platforms.splice(i,1);
    }
    clearPlatforms() {
        this.platforms.splice(0);
    }

    setStatus(approvalStatus,privacyStatus) {
        if (approvalStatus && APPROVAL_STATUSES.includes(approvalStatus))
            this.approvalStatus = approvalStatus;
        if(privacyStatus && PRIVACY_STATUSES.includes(privacyStatus)) 
            this.privacyStatus = privacyStatus;
    }
    setName(name) {
        if (typeof(name)=="string"&&name.length>0)
            this.name = name;
    }
    setURL(url) {
        if (typeof(url)=="string")
            this.url = url;
    }

    toJSON(keepArraysSeparate) {
        var platformIds = this.platforms.map(v=>PLATFORMS.indexOf(v)).filter(v=>v>=0);
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            approvalStatus: APPROVAL_STATUSES.indexOf(this.approvalStatus),
            privacyStatus: PRIVACY_STATUSES.indexOf(this.privacyStatus),
            platforms: keepArraysSeparate?platformIds.join():platformIds
        };
    }

    toString() {
        return JSON.stringify({
            name: this.name,
            url: this.url,
            approvalStatus: this.approvalStatus,
            privacyStatus: this.privacyStatus,
            platforms: this.platforms
        });
    }
}


export { Application, APPROVAL_STATUSES, PRIVACY_STATUSES, PLATFORMS, APPROVAL_STATUSES_NAME, PRIVACY_STATUSES_NAME, PLATFORMS_NAME};