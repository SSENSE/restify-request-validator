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
        validator = new RequestValidator(Error);
    });

    it('RequestValidator::validate() empty', () => {
        expected = undefined;
        validator.validate({}, null, test);
        validator.validate({route: { validation: { url: null}}}, null, test);
        validator.validate({route: { validation: { url: { name: { type: 'string'}}}}}, null, test);
    });

    it('RequestValidator::validate() required', () => {
        expected = 'Url: Param id is required';
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
        expected = 'Url: Param id has invalid type (number)';
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

        expected = 'Url: Param categories has invalid content type (number[])';
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

        expected = 'Body: Param categories must have a minimum length of 1';
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

        expected = 'Body: Param createdAt has invalid type (date)';
        validator.validate({
            route: {
                validation: {
                    body: {
                        createdAt: {type: 'date', required: true}
                    }
                }
            }, params: {
                createdAt: 'foo'
            }
        }, null, test);

        expected = undefined;//'Body: Param categories must have a minimum length of 1';
        validator.validate({
            route: {
                validation: {
                    body: {
                        createdAt: {type: 'date', required: true}
                    }
                }
            }, params: {
                createdAt: '2016-09-01T18:29:25.642Z'
            }
        }, null, test);
    });

    it('RequestValidator::validate() date', () => {
        var date = '2016-10-06T16:32:39.246Z';
        var req = {
            route: {
                validation: {
                    body: {
                        startedAt: {type: 'date'}
                    }
                }
            }, params: {
                startedAt: date
            }
        };

        validator.validate(req, null, (err: any) => {
            expect(err).to.be.undefined;
            expect(typeof req.params.startedAt).to.be.equal('object');
            expect(typeof (<any> req.params.startedAt).getTime).to.be.equal('function');
            expect((<any> req.params.startedAt).getTime()).to.be.equal(Date.parse(date));

            // double date validation
            validator.validate(req, null, (err: any) => {
                expect(err).to.be.undefined;
                expect(typeof req.params.startedAt).to.be.equal('object');
                expect(typeof (<any> req.params.startedAt).getTime).to.be.equal('function');
                expect((<any> req.params.startedAt).getTime()).to.be.equal(Date.parse(date));
            });
        });
    });

    it('RequestValidator::validate() min', () => {
        expected = 'Query: Param id must have a minimum length of 2';
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

        expected = 'Query: Param name must have a minimum length of 4';
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
        expected = 'Query: Param id must have a maximum length of 2';
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

        expected = 'Query: Param name must have a maximum length of 2';
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
        expected = 'Query: Param designers must have a length of 2';
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
        expected = 'Query: Param gender must belong to [men,women]';
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

        expected = 'Query: Param with must belong to [men,women]';
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
        expected = 'Url: Param latlng must match regex /[-+]?\\d*\\.\\d*,[-+]?\\d*\\.\\d*/';
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

    it('RequestValidator::validate() boolean', () => {
        expected = undefined;
        validator.validate({
            route: {
                validation: {
                    body: {
                        enabled: {type: 'boolean', required: true}
                    }
                }
            }, params: {
                enabled: 'true'
            }
        }, null, test);

        validator.validate({
            route: {
                validation: {
                    body: {
                        enabled: {type: 'boolean', required: true}
                    }
                }
            }, params: {
                enabled: '0'
            }
        }, null, test);
    });

    it('RequestValidator with failOnFirstError=false', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param description is required\nQuery: Param enabled is required\nQuery: Param designers must have a length of 2';
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
                designers: '1,3,9',
            }
        }, null, test);
    });
});
