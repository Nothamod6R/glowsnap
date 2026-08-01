import {main} from '../models';

export function DeleteScreenshot(arg1:string):Promise<void>;

export function GetHomeDir():Promise<string>;

export function GetScreenshotsBaseURL():Promise<string>;

export function ListScreenshots():Promise<Array<main.ScreenshotInfo>>;

export function OpenToolsPalette():Promise<void>;

export function PauseRecording():Promise<void>;

export function RenameScreenshot(arg1:string,arg2:string):Promise<void>;

export function ResizeToPalette():Promise<void>;

export function ResizeToStudio():Promise<void>;

export function ResumeRecording():Promise<void>;

export function SaveFileDialog(arg1:string):Promise<string>;

export function StartRecording(arg1:string,arg2:boolean,arg3:boolean):Promise<void>;

export function StopRecording():Promise<string>;

export function TakeAreaScreenshot():Promise<void>;

export function TakeScreenshot():Promise<void>;

export function WriteFile(arg1:string,arg2:Array<number>):Promise<void>;
