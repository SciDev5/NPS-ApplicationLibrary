const APPROVAL_STATUSES = ["UNK","APPROVED","14_PARENTAL_CONSENT","PARENT_INFORMED","PILOT","INSTRUCTOR_ONLY","PENDING","DENIED"];
const PRIVACY_STATUSES = ["UNK","COMPLIANT","NONCOMPLIANT","PARENTAL_CONSENT","INSTRUCTOR_ONLY","NO_INFO_COLLECTED","NOT_APPLICABLE"];
const PLATFORMS = ["WINDOWS","MACOS","LINUX","ANDROID_PHONE","ANDROID_TABLET","IOS_PHONE","IOS_TABLET","WEB","CHROMEBOOK"];
const GRADE_LEVELS = ["PRE_K","K","1","2","3","4","5","6","7","8","9","10","11","12"];
const SUBJECTS = ["COOL_STUFF","NOT_COOL_STUFF"];

const APPROVAL_STATUSES_NAME = ["unk","approved","14parent","parentInfo","pilot","instructor","pending","denied"].map(v=>"application.approvalStatus."+v);
const PRIVACY_STATUSES_NAME = ["unk","compliant","noncompliant","parent","instructor","noInfo","na"].map(v=>"application.privacyStatus."+v);
const PLATFORMS_NAME = ["windows","mac","linux","androidPhone","androidTablet","applePhone","appleTablet","web","chromebook"].map(v=>"application.platform."+v);
const GRADE_LEVELS_NAME = ["preK","k","1","2","3","4","5","6","7","8","9","10","11","12"].map(v=>"application.gradeLevel."+v);
const SUBJECTS_NAME = ["cool", "uncool"].map(v=>"application.subject."+v);

class Application {
    constructor(/** @type {{id?:number,name:string,platforms:string[],gradeLevels:string[],subjects:string[],url?:string,approvalStatus:string,privacyStatus:string}} */ obj) {
        if (obj == null) throw new Error("Application constructed with null params.");
        var {id,name,platforms,gradeLevels,subjects,url,approvalStatus,privacyStatus} = obj;
        this.id = id;
        this.name = name || "unnamed";
        this.url = url || "";
        this.platforms = platforms || [];
        this.gradeLevels = gradeLevels || [];
        this.subjects = subjects || [];
        this.approvalStatus = approvalStatus || APPROVAL_STATUSES[0];
        this.privacyStatus = privacyStatus || APPROVAL_STATUSES[0];
    }
    static parse(/** @type {{id:number,name:string,platforms:string|number[],url:string,approvalStatus:number,privacyStatus:number}} */ obj) {
        if (obj == null) throw new Error("Application constructed with null params.");
        var {id,name,platforms,subjects,gradeLevels,url,approvalStatus,privacyStatus} = obj;
        if (typeof(platforms)=="string") platforms = platforms.split(",").map(v=>PLATFORMS[v]).filter(v=>v);
        if (platforms&&typeof(platforms[0])=="number") platforms = platforms.map(v=>PLATFORMS[v]).filter(v=>v);
        if (typeof(gradeLevels)=="string") gradeLevels = gradeLevels.split(",").map(v=>GRADE_LEVELS[v]).filter(v=>v);
        if (gradeLevels&&typeof(gradeLevels[0])=="number") gradeLevels = gradeLevels.map(v=>GRADE_LEVELS[v]).filter(v=>v);
        if (typeof(subjects)=="string") subjects = subjects.split(",").map(v=>SUBJECTS[v]).filter(v=>v);
        if (subjects&&typeof(subjects[0])=="number") subjects = subjects.map(v=>SUBJECTS[v]).filter(v=>v);
        return new Application({id,url,name,platforms,subjects,gradeLevels,approvalStatus:APPROVAL_STATUSES[approvalStatus],privacyStatus:PRIVACY_STATUSES[privacyStatus]});
    }
    

    addPlatform(platform) { if (PLATFORMS.includes(platform) && !this.platforms.includes(platform)) this.platforms.push(platform); }
    removePlatform(platform) {
        var i = this.platforms.indexOf(platform);
        if (i != -1) this.platforms.splice(i,1);
    }
    clearPlatforms() { this.platforms.splice(0); }

    addSubject(subject) { if (SUBJECTS.includes(subject) && !this.subjects.includes(subject)) this.subjects.push(subject); }
    removeSubject(subject) {
        var i = this.subjects.indexOf(subject);
        if (i != -1) this.subjects.splice(i,1);
    }
    clearSubjects() { this.subjects.splice(0); }

    addGradeLevel(gradeLevel) { if (GRADE_LEVELS.includes(gradeLevel) && !this.gradeLevels.includes(gradeLevel)) this.gradeLevels.push(gradeLevel); }
    removeGradeLevel(gradeLevel) {
        var i = this.gradeLevels.indexOf(gradeLevel);
        if (i != -1) this.gradeLevels.splice(i,1);
    }
    clearGradeLevels() { this.gradeLevels.splice(0); }


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
        var gradeLevelIds = this.gradeLevels.map(v=>GRADE_LEVELS.indexOf(v)).filter(v=>v>=0);
        var subjectIds = this.subjects.map(v=>SUBJECTS.indexOf(v)).filter(v=>v>=0);
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            approvalStatus: APPROVAL_STATUSES.indexOf(this.approvalStatus),
            privacyStatus: PRIVACY_STATUSES.indexOf(this.privacyStatus),
            platforms: keepArraysSeparate?platformIds:platformIds.join(),
            subjects: keepArraysSeparate?subjectIds:subjectIds.join(),
            gradeLevels: keepArraysSeparate?gradeLevelIds:gradeLevelIds.join()
        };
    }

    toString() {
        return JSON.stringify({
            name: this.name,
            url: this.url,
            approvalStatus: this.approvalStatus,
            privacyStatus: this.privacyStatus,
            platforms: this.platforms,
            gradeLevels: this.gradeLevels,
            subjects: this.subjects
        });
    }
}


export { 
    Application,
    APPROVAL_STATUSES,
    PRIVACY_STATUSES,
    PLATFORMS,
    GRADE_LEVELS,
    SUBJECTS,
    APPROVAL_STATUSES_NAME,
    PRIVACY_STATUSES_NAME,
    PLATFORMS_NAME,
    GRADE_LEVELS_NAME,
    SUBJECTS_NAME
};