const APPROVAL_STATUSES = ["UNK","NOT_APPROVED","APPROVED","14_PARENTAL_CONSENT","PARENT_INFORMED","PILOT","INSTRUCTOR_ONLY","PENDING","DENIED"];
const PRIVACY_STATUSES = ["UNK","COMPLIENT","NONCOMPLIENT","PARENTAL_CONSENT","INSTRUCTOR_ONLY","NO_INFO_COLLECTED","NOT_APPLICABLE"];
const PLATFORMS = ["WINDOWS","MACOS","LINUX","ANDROID_PHONE","ANDROID_TABLET","IOS_PHONE","IOS_TABLET","WEB"]

class Application {
    constructor(/** @type {{id?:number,name:string,tags:number[],platforms:string[],url?:string,approvalStatus:string,privacyStatus:string}} */ obj) {
        var {id,name,tags,platforms,url,approvalStatus,privacyStatus} = obj;
        this.id = id;
        this.name = name || "unnamed";
        this.url = url || "";
        this.platforms = platforms
        this.tags = tags || [];
        this.approvalStatus = approvalStatus || APPROVAL_STATUSES[0];
        this.privacyStatus = privacyStatus || APPROVAL_STATUSES[0];
    }

    addTag(tagId) {
        if (!this.tags.includes(tagId)) this.tags.push(tagId);
    }
    removeTag(tagId) {
        var i = this.tags.indexOf(tagId);
        if (i != -1) this.tags.splice(i,1);
    }
    clearTags() {
        this.tags.splice(0);
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

    toJSON() {
        return {name:this.name,url:this.url,tags:this.tags,approvalStatus:this.approvalStatus,privacyStatus:this.privacyStatus};
    }
}


export { Application, APPROVAL_STATUSES, PRIVACY_STATUSES };