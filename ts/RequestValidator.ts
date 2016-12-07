import {ParamValidation} from './ParamValidation';

const supportedTypes = ['string', 'number', 'boolean', 'numeric', 'date', 'array', 'object'];
const supportedArrayTypes = ['string', 'number', 'boolean', 'numeric'];

// tslint:disable:no-reserved-keywords no-any
interface TypeValidation {
    value: any;
    type: string;
}

interface ErrorMessage {
    message: string;
    isCustom: boolean;
}

export class RequestValidator {
    private errorHandler: any;
    private failOnFirstError: boolean = true;
    private customErrorMessages: any;

    constructor(errorHandler: any = Error) {
        this.errorHandler = errorHandler;
    }

    public disableFailOnFirstError(): void {
        this.failOnFirstError = false;
    }

    protected getErrorMessage(field: string, errorType: string, defaultMessage: string): ErrorMessage {
        if (this.customErrorMessages.hasOwnProperty(field) && this.customErrorMessages[field].hasOwnProperty(errorType)) {
            return {
                message: this.customErrorMessages[field][errorType],
                isCustom: true
            };
        }
        return {
            message: defaultMessage,
            isCustom: false
        };
    }

    public validate(req: any, res: any, next: Function): void {
        if (req.hasOwnProperty('route') && req.route.hasOwnProperty('validation')) {
            if (req.route.hasOwnProperty('validationMessages')) {
                this.customErrorMessages = req.route.validationMessages;
            } else {
                this.customErrorMessages = {};
            }

            let errorMessages: string[] = [];
            if (req.route.validation.hasOwnProperty('url')) {
                errorMessages = errorMessages.concat(
                    this.validateFields(req.params, req.route.validation.url, true)
                        .map(msg => msg.isCustom ? msg.message : `Url: ${msg.message}`)
                );
            }
            if (req.route.validation.hasOwnProperty('query')) {
                errorMessages = errorMessages.concat(
                    this.validateFields(req.query, req.route.validation.query, true)
                        .map(msg => msg.isCustom ? msg.message : `Query: ${msg.message}`)
                );
            }
            if (req.route.validation.hasOwnProperty('body')) {
                errorMessages = errorMessages.concat(
                    this.validateFields(req.params, req.route.validation.body, false)
                        .map(msg => msg.isCustom ? msg.message : `Body: ${msg.message}`)
                );
            }

            if (errorMessages.length) {
                if (this.failOnFirstError) {
                    next(new this.errorHandler(errorMessages[0]));
                } else {
                    next(new this.errorHandler(errorMessages.join('\n')));
                }
                return;
            }
        }

        next();
    }

    private static buildValidationParam(validation: any): ParamValidation {
        if (!validation.hasOwnProperty('type') || supportedTypes.indexOf(validation.type) < 0) {
            return null;
        }
        const paramValidation = new ParamValidation();
        paramValidation.type = validation.type;

        // Add "required" param
        if (validation.hasOwnProperty('required') && typeof validation.required === 'boolean') {
            paramValidation.required = validation.required;
        }

        // Add "min" param
        if (validation.hasOwnProperty('min') && typeof validation.min === 'number') {
            paramValidation.min = validation.min;
        }

        // Add "max" param
        if (validation.hasOwnProperty('max') && typeof validation.max === 'number') {
            paramValidation.max = validation.max;
        }

        // Add "length" param
        if (validation.hasOwnProperty('length') && typeof validation.length === 'number') {
            paramValidation.length = validation.length;
        }

        // Add "arrayType" param
        if (validation.hasOwnProperty('arrayType') && supportedArrayTypes.indexOf(validation.arrayType) >= 0) {
            paramValidation.arrayType = validation.arrayType;
        }

        // Add "values" param
        if (validation.hasOwnProperty('values') && validation.values instanceof Array) {
            paramValidation.values = validation.values;
        }

        // Add "regex" param
        if (validation.hasOwnProperty('regex') && validation.regex instanceof RegExp) {
            paramValidation.regex = validation.regex;
        }

        return paramValidation;
    }

    private validateFields(input: any, validation: any, inUrl: boolean): ErrorMessage[] {
        if (validation) {
            let errorMessages: ErrorMessage[] = [];

            for (const key of Object.keys(validation)) {
                const paramValidation = RequestValidator.buildValidationParam(validation[key]);
                if (paramValidation) {
                    // Check "required" param
                    const type = input ? typeof input[key] : undefined;
                    if (paramValidation.required === true && (!input || type === 'undefined')) {
                        errorMessages = errorMessages.concat(
                            this.getErrorMessage(key, 'required', `Param ${key} is required`)
                        );
                    }

                    if (input) {
                        // Parse array from url (comma separated string)
                        if (type === 'string' && inUrl && paramValidation.type === 'array') {
                            input[key] = input[key].split(',');
                        }

                        errorMessages = errorMessages.concat(this.validateField(input, key, type, paramValidation));
                        if (this.failOnFirstError && errorMessages.length) {
                            break;
                        }
                    }
                }
            }

            return errorMessages;
        }

        return [];
    }

    private validateField(input: any, key: any, type: any, paramValidation: any): ErrorMessage[] {
        const errorMessages: ErrorMessage[] = [];

        // Check type
        const typeValidation = {value: input[key], type: paramValidation.type};
        if (RequestValidator.checkType(typeValidation) !== true) {
            errorMessages.push(
                this.getErrorMessage(key, 'type', `Param ${key} has invalid type (${paramValidation.type})`)
            );
        }

        if (typeValidation.value !== undefined) {
            input[key] = typeValidation.value;
        }

        // Parse "numeric" values to numbers in order to pass next validations
        if (type !== 'undefined' && paramValidation.type === 'numeric') {
            input[key] = parseInt(input[key], 10);
        }

        // Check array content if needed
        if (input[key] instanceof Array
            && RequestValidator.checkArrayType(input[key], paramValidation.arrayType) !== true) {
            errorMessages.push(
                this.getErrorMessage(key, 'arrayType', `Param ${key} has invalid content type (${paramValidation.arrayType}[])`)
            );
        }

        // Check length
        if (RequestValidator.checkLength(input[key], paramValidation.length) !== true) {
            errorMessages.push(
                this.getErrorMessage(key, 'length', `Param ${key} must have a length of ${paramValidation.length}`)
            );
        }

        // Check min
        if (RequestValidator.checkMin(input[key], paramValidation.min) !== true) {
            errorMessages.push(
                this.getErrorMessage(key, 'min', `Param ${key} must have a minimum length of ${paramValidation.min}`)
            );
        }

        // Check max
        if (RequestValidator.checkMax(input[key], paramValidation.max) !== true) {
            errorMessages.push(
                this.getErrorMessage(key, 'max', `Param ${key} must have a maximum length of ${paramValidation.max}`)
            );
        }

        // Check values
        if (RequestValidator.checkValues(input[key], paramValidation.values) !== true) {
            errorMessages.push(
                this.getErrorMessage(key, 'values', `Param ${key} must belong to [${paramValidation.values.toString()}]`)
            );
        }

        // Check regex
        if (paramValidation.regex && !paramValidation.regex.test(input[key])) {
            errorMessages.push(
                this.getErrorMessage(key, 'regex', `Param ${key} must match regex ${paramValidation.regex}`)
            );
        }

        return errorMessages;
    }

    private static checkType(typeValidation: TypeValidation): boolean {
        const inputType = typeof typeValidation.value;

        if (inputType === 'undefined') {
            return true;
        } else if (typeValidation.type === 'numeric') {
            return !isNaN(typeValidation.value);
        } else if (typeValidation.type === 'boolean') {
            return ['0', '1', 'false', 'true', false, true, 0, 1].indexOf(typeValidation.value) !== -1;
        } else if (typeValidation.type === 'date') {
            if (typeof typeValidation.value === 'object' && typeof typeValidation.value.getTime === 'function') {
                return true;
            }

            const milliseconds = Date.parse(typeValidation.value);
            if (isNaN(milliseconds)) {
                return false;
            }

            // We update the input with a valid Date object instead of a string
            typeValidation.value = new Date();
            typeValidation.value.setTime(milliseconds);

            return true;
        } else if (typeValidation.type === 'array') {
            return typeValidation.value instanceof Array;
        }
        return inputType === typeValidation.type;
    }

    private static checkArrayType(input: any[], type: string): boolean {
        if (input.length === 0 || type === null) {
            return true;
        }
        for (let i = 0; i < input.length; i += 1) {
            const valid = (type === 'numeric') ? !isNaN(input[i]) : typeof input[i] === type;
            if (valid !== true) {
                return false;
            }
        }
        return true;
    }

    private static checkLength(input: any, length: number): boolean {
        if (length === null) {
            return true;
        }
        if (input instanceof Array) {
            return input.length === length;
        }
        switch (typeof input) {
            case 'undefined':
                return true;
            case 'number':
                return true;
            case 'string':
                return input.length === length;
            default:
                return true;
        }
    }

    private static checkMin(input: any, min: number): boolean {
        if (input instanceof Array) {
            return input.length >= min;
        }
        switch (typeof input) {
            case 'undefined':
                return true;
            case 'number':
                return input >= min;
            case 'string':
                return input.length >= min;
            default:
                return true;
        }
    }

    private static checkMax(input: any, max: number): boolean {
        if (max === null) {
            return true;
        }
        if (input instanceof Array) {
            return input.length <= max;
        }
        switch (typeof input) {
            case 'undefined':
                return true;
            case 'number':
                return input <= max;
            case 'string':
                return input.length <= max;
            default:
                return true;
        }
    }

    private static checkValues(input: any, values: any[]): boolean {
        if (input === undefined || !values || values.length === 0) {
            return true;
        }
        if (input instanceof Array) {
            for (let i = 0; i < input.length; i += 1) {
                if (values.indexOf(input[i]) < 0) {
                    return false;
                }
            }
            return true;
        }
        return values.indexOf(input) >= 0;
    }
}
