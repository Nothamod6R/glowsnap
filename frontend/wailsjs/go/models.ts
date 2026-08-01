export namespace main {
	
	export class ScreenshotInfo {
	    name: string;
	    path: string;
	    size: number;
	    createdAt: number;
	    modifiedAt: number;
	    date: number;
	    dateSource: string;
	
	    static createFrom(source: any = {}) {
	        return new ScreenshotInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	        this.createdAt = source["createdAt"];
	        this.modifiedAt = source["modifiedAt"];
	        this.date = source["date"];
	        this.dateSource = source["dateSource"];
	    }
	}

}

