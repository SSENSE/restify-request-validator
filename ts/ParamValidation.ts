export class ParamValidation {
    public type: string; // tslint:disable-line:no-reserved-keywords
    public required: boolean = false;
    public min: number = 1;
    public max: number = null;
    public length: number = null;
    public arrayType: string = null;
    public values: any[] = null; // tslint:disable-line:no-any
    public regex: RegExp = null;
    public format: <T>(data: T) => T;
}
