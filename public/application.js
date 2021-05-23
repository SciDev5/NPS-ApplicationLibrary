const APPROVAL_STATUSES = ["UNK","APPROVED","14_PARENTAL_CONSENT","PARENT_INFORMED","PILOT","INSTRUCTOR_ONLY","PENDING","DENIED"];
const PRIVACY_STATUSES = ["UNK","COMPLIANT","NONCOMPLIANT","PARENTAL_CONSENT","INSTRUCTOR_ONLY","NO_INFO_COLLECTED","NOT_APPLICABLE"];
const PLATFORMS = ["WINDOWS","MACOS","LINUX","ANDROID_PHONE","ANDROID_TABLET","IOS_PHONE","IOS_TABLET","WEB","CHROMEBOOK"];
const GRADE_LEVELS = ["PRE_K","K","1","2","3","4","5","6","7","8","9","10","11","12"];
const SUBJECTS = ["MATH","SCIENCE","HISTORY","ENGLISH","LANGUAGE","CS","ART","MUSIC"];

const APPROVAL_STATUSES_NAME = ["unk","approved","14parent","parentInfo","pilot","instructor","pending","denied"].map(v=>"application.approvalStatus."+v);
const PRIVACY_STATUSES_NAME = ["unk","compliant","noncompliant","parent","instructor","noInfo","na"].map(v=>"application.privacyStatus."+v);
const PLATFORMS_NAME = ["windows","mac","linux","androidPhone","androidTablet","applePhone","appleTablet","web","chromebook"].map(v=>"application.platform."+v);
const GRADE_LEVELS_NAME = ["preK","k","1","2","3","4","5","6","7","8","9","10","11","12"].map(v=>"application.gradeLevel."+v);
const SUBJECTS_NAME = ["math", "science","history","english","language","cs","art","music"].map(v=>"application.subject."+v);

class Application {
    constructor(/** @type {{id?:number,name:string,platforms:string[],grades:string[],subjects:string[],url?:string,approval:string,privacy:string}} */ obj) {
        if (obj == null) throw new Error("Application constructed with null params.");
        var {id,name,platforms,grades,subjects,url,approval,privacy} = obj;
        this.id = id;
        this.name = name || "unnamed";
        this.url = url || "";
        this.platforms = platforms || [];
        this.grades = grades || [];
        this.subjects = subjects || [];
        this.approval = approval || APPROVAL_STATUSES[0];
        this.privacy = privacy || APPROVAL_STATUSES[0];
    }
    static parse(/** @type {{id:number,name:string,platforms:string|number[],url:string,approval:number,privacy:number}} */ obj) {
        if (obj == null) throw new Error("Application constructed with null params.");
        var {id,name,platforms,subjects,grades,grades,url,approval,privacy} = obj;
        if (typeof(platforms)=="string") platforms = platforms.split(",").map(v=>PLATFORMS[v]).filter(v=>v);
        if (platforms&&typeof(platforms[0])=="number") { platforms.sort(); platforms = platforms.map(v=>PLATFORMS[v]).filter(v=>v); }
        if (typeof(grades)=="string") grades = grades.split(",").map(v=>GRADE_LEVELS[v]).filter(v=>v);
        if (grades&&typeof(grades[0])=="number") { grades.sort(); grades = grades.map(v=>GRADE_LEVELS[v]).filter(v=>v); }
        if (typeof(subjects)=="string") subjects = subjects.split(",").map(v=>SUBJECTS[v]).filter(v=>v);
        if (subjects&&typeof(subjects[0])=="number") { subjects.sort(); subjects = subjects.map(v=>SUBJECTS[v]).filter(v=>v); }
        return new Application({id,url,name,platforms,subjects,grades,approval:APPROVAL_STATUSES[approval],privacy:PRIVACY_STATUSES[privacy]});
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

    addGradeLevel(grade) { if (GRADE_LEVELS.includes(grade) && !this.grades.includes(grade)) this.grades.push(grade); }
    removeGradeLevel(grade) {
        var i = this.grades.indexOf(grade);
        if (i != -1) this.grades.splice(i,1);
    }
    clearGradeLevels() { this.grades.splice(0); }


    setStatus(approval,privacy) {
        if (approval && APPROVAL_STATUSES.includes(approval))
            this.approval = approval;
        if(privacy && PRIVACY_STATUSES.includes(privacy)) 
            this.privacy = privacy;
    }
    setName(name) {
        if (typeof(name)=="string"&&name.length>0)
            this.name = name;
    }
    setURL(url) {
        if (typeof(url)=="string")
            this.url = url;
    }

    toJSON(keepArraysSeparate,dontCastIds) {
        var platformIds = dontCastIds?this.platforms.map(v=>v):this.platforms.map(v=>PLATFORMS.indexOf(v)).filter(v=>v>=0);
        var gradeIds = dontCastIds?this.grades.map(v=>v):this.grades.map(v=>GRADE_LEVELS.indexOf(v)).filter(v=>v>=0);
        var subjectIds = dontCastIds?this.subjects.map(v=>v):this.subjects.map(v=>SUBJECTS.indexOf(v)).filter(v=>v>=0);
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            approval: dontCastIds?this.approval:APPROVAL_STATUSES.indexOf(this.approval),
            privacy: dontCastIds?this.privacy:PRIVACY_STATUSES.indexOf(this.privacy),
            platforms: keepArraysSeparate?platformIds:platformIds.join(),
            subjects: keepArraysSeparate?subjectIds:subjectIds.join(),
            grades: keepArraysSeparate?gradeIds:gradeIds.join()
        };
    }

    toString() {
        return JSON.stringify({
            name: this.name,
            url: this.url,
            approval: this.approval,
            privacy: this.privacy,
            platforms: this.platforms,
            grades: this.grades,
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