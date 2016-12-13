"use strict";
var ParamValidation = (function () {
    function ParamValidation() {
        this.required = false;
        this.min = 1;
        this.max = null;
        this.length = null;
        this.arrayType = null;
        this.values = null;
        this.regex = null;
        this.terminal = false;
    }
    return ParamValidation;
}());
exports.ParamValidation = ParamValidation;
//# sourceMappingURL=ParamValidation.js.map