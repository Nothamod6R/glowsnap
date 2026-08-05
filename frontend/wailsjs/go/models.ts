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

export namespace screencast {
	
	export class AudioDevice {
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new AudioDevice(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class SystemAudioInfo {
	    supported: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemAudioInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.supported = source["supported"];
	        this.message = source["message"];
	    }
	}

}

