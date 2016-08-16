import {expect} from 'chai';
import {RequestValidator} from '../../ts/RequestValidator';
let validator: RequestValidator = null;
let expected: any = null;

function test(err: any): void {
    if (err) {
        expect(err.message).to.equal(expected);
    } else {
        expect(err).to.equal(expected);
    }
}

// tslint:disable no-http-string
describe('RequestValidator', () => {
    before(() => {
        validator = new RequestValidator();
    });

    it('RequestValidator::validate() empty', () => {
        expected = undefined;
        validator.validate({}, null, test);
        validator.validate({route: { validation: { url: null}}}, null, test);
        validator.validate({route: { validation: { url: { name: { type: 'string'}}}}}, null, test);
    });

    it('RequestValidator::validate() required', () => {
        expected = 'url: Param id is required';
        validator.validate({
            route: {
                validation: {
                    url: {
                        name: {required: true}, // Will not throw an error because type is not defined
                        id: {type: 'number', required: true}
                    }
                }
            }, params: {
            }
        }, null, test);
    });

    it('RequestValidator::validate() type', () => {
        expected = 'url: Param id has invalid type (number)';
        validator.validate({
            route: {
                validation: {
                    url: {
                        id: {type: 'number'}
                    }
                }
            }, params: {
                id: 'foo'
            }
        }, null, test);

        expected = undefined;
        validator.validate({
            route: {
                validation: {
                    query: {
                        name: {type: 'string', required: false},
                        id: {type: 'numeric', required: false}
                    }
                }
            }, query: {
                id: '5'
            }
        }, null, test);

        expected = 'url: Param categories has invalid content type (number[])';
        validator.validate({
            route: {
                validation: {
                    url: {
                        designers: {type: 'array', required: true, arrayType: 'numeric'},
                        categories: {type: 'array', required: true, arrayType: 'number'}
                    }
                }
            }, params: {
                designers: '1,2',
                categories: 'foo,1'
            }
        }, null, test);

        expected = 'body: Param categories must have a minimum length of 1';
        validator.validate({
            route: {
                validation: {
                    body: {
                        categories: {type: 'array', required: false, arrayType: 'number'}
                    }
                }
            }, params: {
                categories: []
            }
        }, null, test);
    });

    it('RequestValidator::validate() min', () => {
        expected = 'query: Param id must have a minimum length of 2';
        validator.validate({
            route: {
                validation: {
                    query: {
                        id: {type: 'number', required: true, min: 2}
                    }
                }
            }, query: {
                id: 1
            }
        }, null, test);

        expected = 'query: Param name must have a minimum length of 4';
        validator.validate({
            route: {
                validation: {
                    query: {
                        name: {type: 'string', required: true, min: 4}
                    }
                }
            }, query: {
                name: 'foo'
            }
        }, null, test);

        expected = undefined;
        validator.validate({
            route: {
                validation: {
                    body: {
                        enabled: {type: 'boolean', required: true}
                    }
                }
            }, params: {
                enabled: true
            }
        }, null, test);
    });

    it('RequestValidator::validate() max', () => {
        expected = 'query: Param id must have a maximum length of 2';
        validator.validate({
            route: {
                validation: {
                    query: {
                        name: {type: 'string', required: false, max: 3},
                        id: {type: 'numeric', required: true, max: 2}
                    }
                }
            }, query: {
                id: '3'
            }
        }, null, test);

        expected = 'query: Param name must have a maximum length of 2';
        validator.validate({
            route: {
                validation: {
                    query: {
                        designers: {type: 'array', required: true, max: 3},
                        enabled: {type: 'boolean', required: true, max: 2},
                        name: {type: 'string', required: true, max: 2}
                    }
                }
            }, query: {
                name: 'foo',
                designers: '1,foo',
                enabled: false
            }
        }, null, test);
    });

    it('RequestValidator::validate() length', () => {
        expected = 'query: Param designers must have a length of 2';
        validator.validate({
            route: {
                validation: {
                    query: {
                        id: {type: 'numeric', required: true, length: 3},
                        name: {type: 'string', required: false, length: 4},
                        description: {type: 'string', required: true, length: 3},
                        enabled: {type: 'boolean', required: true, length: 10},
                        designers: {type: 'array', required: true, length: 2}
                    }
                }
            }, query: {
                id: '3456',
                description: 'foo',
                designers: '1,3,9',
                enabled: true
            }
        }, null, test);
    });

    it('RequestValidator::validate() values', () => {
        expected = 'query: Param gender must belong to [men,women]';
        validator.validate({
            route: {
                validation: {
                    query: {
                        with: {type: 'array', required: true, values: ['men', 'women']},
                        gender: {type: 'string', required: true, values: ['men', 'women']},
                    }
                }
            }, query: {
                with: 'men,men',
                gender: 'foo'
            }
        }, null, test);

        expected = 'query: Param with must belong to [men,women]';
        validator.validate({
            route: {
                validation: {
                    query: {
                        with: {type: 'array', required: true, values: ['men', 'women']}
                    }
                }
            }, query: {
                with: 'men,foo',
            }
        }, null, test);
    });

    it('RequestValidator::validate() regex', () => {
        expected = 'url: Param latlng must match regex /[-+]?\\d*\\.\\d*,[-+]?\\d*\\.\\d*/';
        validator.validate({
            route: {
                validation: {
                    url: {
                        latlng: {type: 'string', required: true, regex: /[-+]?\d*\.\d*,[-+]?\d*\.\d*/}
                    }
                }
            }, params: {
                latlng: 'foo'
            }
        }, null, test);
    });
});
