export class RequestValidator {
    constructor(errorHandler?: any);

    public validate(req: any, res: any, next: Function): void;
    public disableFailOnFirstError(): void;
}
