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

export namespace settings {
	
	export class Recording {
	    saveDir: string;
	    microphone: string;
	
	    static createFrom(source: any = {}) {
	        return new Recording(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.saveDir = source["saveDir"];
	        this.microphone = source["microphone"];
	    }
	}
	export class Screenshot {
	    saveDir: string;
	
	    static createFrom(source: any = {}) {
	        return new Screenshot(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.saveDir = source["saveDir"];
	    }
	}
	export class Settings {
	    screenshot: Screenshot;
	    recording: Recording;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.screenshot = this.convertValues(source["screenshot"], Screenshot);
	        this.recording = this.convertValues(source["recording"], Recording);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

