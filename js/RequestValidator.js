"use strict";
var ParamValidation_1 = require('./ParamValidation');
var supportedTypes = ['string', 'number', 'boolean', 'numeric', 'array', 'object'];
var supportedArrayTypes = ['string', 'number', 'boolean', 'numeric'];
var RequestValidator = (function () {
    function RequestValidator(errorHandler) {
        if (errorHandler === void 0) { errorHandler = Error; }
        this.errorHandler = errorHandler;
    }
    RequestValidator.prototype.validate = function (req, res, next) {
        try {
            if (req.hasOwnProperty('route') && req.route.hasOwnProperty('validation')) {
                if (req.route.validation.hasOwnProperty('url')) {
                    try {
                        this.validateFields(req.params, req.route.validation.url, true);
                    }
                    catch (err) {
                        throw new Error("url: " + err.message);
                    }
                }
                if (req.route.validation.hasOwnProperty('query')) {
                    try {
                        this.validateFields(req.query, req.route.validation.query, true);
                    }
                    catch (err) {
                        throw new Error("query: " + err.message);
                    }
                }
                if (req.route.validation.hasOwnProperty('body')) {
                    try {
                        this.validateFields(req.params, req.route.validation.body, false);
                    }
                    catch (err) {
                        throw new Error("body: " + err.message);
                    }
                }
            }
        }
        catch (err) {
            next(new this.errorHandler(err.message));
            return;
        }
        next();
    };
    RequestValidator.buildValidationParam = function (validation) {
        if (!validation.hasOwnProperty('type') || supportedTypes.indexOf(validation.type) < 0) {
            return null;
        }
        var paramValidation = new ParamValidation_1.ParamValidation();
        paramValidation.type = validation.type;
        if (validation.hasOwnProperty('required') && typeof validation.required === 'boolean') {
            paramValidation.required = validation.required;
        }
        if (validation.hasOwnProperty('min') && typeof validation.min === 'number') {
            paramValidation.min = validation.min;
        }
        if (validation.hasOwnProperty('max') && typeof validation.max === 'number') {
            paramValidation.max = validation.max;
        }
        if (validation.hasOwnProperty('length') && typeof validation.length === 'number') {
            paramValidation.length = validation.length;
        }
        if (validation.hasOwnProperty('arrayType') && supportedArrayTypes.indexOf(validation.arrayType) >= 0) {
            paramValidation.arrayType = validation.arrayType;
        }
        if (validation.hasOwnProperty('values') && validation.values instanceof Array) {
            paramValidation.values = validation.values;
        }
        if (validation.hasOwnProperty('regex') && validation.regex instanceof RegExp) {
            paramValidation.regex = validation.regex;
        }
        return paramValidation;
    };
    RequestValidator.prototype.validateFields = function (input, validation, inUrl) {
        if (validation) {
            Object.keys(validation).forEach(function (key) {
                var paramValidation = RequestValidator.buildValidationParam(validation[key]);
                if (paramValidation) {
                    var type = input ? typeof input[key] : undefined;
                    if (paramValidation.required === true && (!input || type === 'undefined')) {
                        throw new Error("Param " + key + " is required");
                    }
                    if (input) {
                        if (type === 'string' && inUrl && paramValidation.type === 'array') {
                            input[key] = input[key].split(',');
                        }
                        if (RequestValidator.checkType(input[key], paramValidation.type) !== true) {
                            throw new Error("Param " + key + " has invalid type (" + paramValidation.type + ")");
                        }
                        if (type !== 'undefined' && paramValidation.type === 'numeric') {
                            input[key] = parseInt(input[key], 10);
                        }
                        if (input[key] instanceof Array
                            && RequestValidator.checkArrayType(input[key], paramValidation.arrayType) !== true) {
                            throw new Error("Param " + key + " has invalid content type (" + paramValidation.arrayType + "[])");
                        }
                        if (RequestValidator.checkLength(input[key], paramValidation.length) !== true) {
                            throw new Error("Param " + key + " must have a length of " + paramValidation.length);
                        }
                        if (RequestValidator.checkMin(input[key], paramValidation.min) !== true) {
                            throw new Error("Param " + key + " must have a minimum length of " + paramValidation.min);
                        }
                        if (RequestValidator.checkMax(input[key], paramValidation.max) !== true) {
                            throw new Error("Param " + key + " must have a maximum length of " + paramValidation.max);
                        }
                        if (RequestValidator.checkValues(input[key], paramValidation.values) !== true) {
                            throw new Error("Param " + key + " must belong to [" + paramValidation.values.toString() + "]");
                        }
                        if (paramValidation.regex && !paramValidation.regex.test(input[key])) {
                            throw new Error("Param " + key + " must match regex " + paramValidation.regex);
                        }
                    }
                }
            });
        }
    };
    RequestValidator.checkType = function (input, type) {
        var inputType = typeof input;
        if (inputType === 'undefined') {
            return true;
        }
        else if (type === 'numeric') {
            return !isNaN(input);
        }
        else if (type === 'array') {
            return input instanceof Array;
        }
        return inputType === type;
    };
    RequestValidator.checkArrayType = function (input, type) {
        if (input.length === 0 || type === null) {
            return true;
        }
        for (var i = 0; i < input.length; i += 1) {
            var valid = (type === 'numeric') ? !isNaN(input[i]) : typeof input[i] === type;
            if (valid !== true) {
                return false;
            }
        }
        return true;
    };
    RequestValidator.checkLength = function (input, length) {
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
    };
    RequestValidator.checkMin = function (input, min) {
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
    };
    RequestValidator.checkMax = function (input, max) {
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
    };
    RequestValidator.checkValues = function (input, values) {
        if (input === undefined || !values || values.length === 0) {
            return true;
        }
        if (input instanceof Array) {
            for (var i = 0; i < input.length; i += 1) {
                if (values.indexOf(input[i]) < 0) {
                    return false;
                }
            }
            return true;
        }
        return values.indexOf(input) >= 0;
    };
    return RequestValidator;
}());
exports.RequestValidator = RequestValidator;
//# sourceMappingURL=RequestValidator.js.map