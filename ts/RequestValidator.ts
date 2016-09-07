import {ParamValidation} from './ParamValidation';

const supportedTypes = ['string', 'number', 'boolean', 'numeric', 'array', 'object'];
const supportedArrayTypes = ['string', 'number', 'boolean', 'numeric'];

// tslint:disable:no-reserved-keywords no-any
export class RequestValidator {
    private errorHandler: any;

    constructor(errorHandler: any = Error) {
        this.errorHandler = errorHandler;
    }

    public validate(req: any, res: any, next: Function): void {
        try {
            if (req.hasOwnProperty('route') && req.route.hasOwnProperty('validation')) {
                if (req.route.validation.hasOwnProperty('url')) {
                    try {
                        this.validateFields(req.params, req.route.validation.url, true);
                    } catch (err) {
                        throw new Error(`Url: ${err.message}`);
                    }
                }
                if (req.route.validation.hasOwnProperty('query')) {
                    try {
                        this.validateFields(req.query, req.route.validation.query, true);
                    } catch (err) {
                        throw new Error(`Query: ${err.message}`);
                    }
                }
                if (req.route.validation.hasOwnProperty('body')) {
                    try {
                        this.validateFields(req.params, req.route.validation.body, false);
                    } catch (err) {
                        throw new Error(`Body: ${err.message}`);
                    }
                }
            }
        } catch (err) {
            next(new this.errorHandler(err.message));
            return;
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

    private validateFields(input: any, validation: any, inUrl: boolean): void {
        if (validation) {
            Object.keys(validation).forEach(key => {
                const paramValidation = RequestValidator.buildValidationParam(validation[key]);
                if (paramValidation) {
                    // Check "required" param
                    const type = input ? typeof input[key] : undefined;
                    if (paramValidation.required === true && (!input || type === 'undefined')) {
                        throw new Error(`Param ${key} is required`);
                    }

                    if (input) {
                        // Parse array from url (comma separated string)
                        if (type === 'string' && inUrl && paramValidation.type === 'array') {
                            input[key] = input[key].split(',');
                        }

                        // Check type
                        if (RequestValidator.checkType(input[key], paramValidation.type) !== true) {
                            throw new Error(`Param ${key} has invalid type (${paramValidation.type})`);
                        }

                        // Parse "numeric" values to numbers in order to pass next validations
                        if (type !== 'undefined' && paramValidation.type === 'numeric') {
                            input[key] = parseInt(input[key], 10);
                        }

                        // Check array content if needed
                        if (input[key] instanceof Array
                            && RequestValidator.checkArrayType(input[key], paramValidation.arrayType) !== true) {
                            throw new Error(`Param ${key} has invalid content type (${paramValidation.arrayType}[])`);
                        }

                        // Check length
                        if (RequestValidator.checkLength(input[key], paramValidation.length) !== true) {
                            throw new Error(`Param ${key} must have a length of ${paramValidation.length}`);
                        }

                        // Check min
                        if (RequestValidator.checkMin(input[key], paramValidation.min) !== true) {
                            throw new Error(`Param ${key} must have a minimum length of ${paramValidation.min}`);
                        }

                        // Check max
                        if (RequestValidator.checkMax(input[key], paramValidation.max) !== true) {
                            throw new Error(`Param ${key} must have a maximum length of ${paramValidation.max}`);
                        }

                        // Check values
                        if (RequestValidator.checkValues(input[key], paramValidation.values) !== true) {
                            throw new Error(`Param ${key} must belong to [${paramValidation.values.toString()}]`);
                        }

                        // Check regex
                        if (paramValidation.regex && !paramValidation.regex.test(input[key])) {
                            throw new Error(`Param ${key} must match regex ${paramValidation.regex}`);
                        }
                    }
                }
            });
        }
    }

    private static checkType(input: any, type: string): boolean {
        const inputType = typeof input;
        if (inputType === 'undefined') {
            return true;
        } else if (type === 'numeric') {
            return !isNaN(input);
        } else if (type === 'array') {
            return input instanceof Array;
        }
        return inputType === type;
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
