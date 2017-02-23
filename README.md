# Restify request validator

[![Build Status](https://travis-ci.org/SSENSE/restify-request-validator.svg?branch=master)](https://travis-ci.org/SSENSE/restify-request-validator)
[![Coverage Status](https://coveralls.io/repos/github/SSENSE/restify-request-validator/badge.svg?branch=master)](https://coveralls.io/github/SSENSE/restify-request-validator?branch=master)
[![Latest Stable Version](https://img.shields.io/npm/v/@ssense/restify-request-validator.svg)](https://www.npmjs.com/package/@ssense/restify-request-validator)
[![Known Vulnerabilities](https://snyk.io/test/npm/@ssense/restify-request-validator/badge.svg)](https://snyk.io/test/npm/@ssense/restify-request-validator)

Simple restify middleware which adds validation for all incoming requests.

## Use in project

### Installation

To install the validator for use in your project, go to your project's main directory, then run the following command:

```
npm install --production --save @ssense/restify-request-validator
```

### Usage

To add the middleware to your current restify project, follow the snippet below:

#### Initialization

##### For javascript project

```js
// Require module
var restifyValidation = require('@ssense/restify-request-validator');
...
// Create restify server
var server = restify.createServer();
...
// Add middleware
var validator = new restifyValidation.RequestValidator();
server.use(validator.validate.bind(validator));
```

By default, on each validation error, the `RequestValidator` will throw an `Error` object with a `500` HTTP code.

You can throw a specific restify error and http code, by passing it to the constructor:

```js
var validator = new restifyValidation.RequestValidator(restify.BadRequestError);
```

With this configuration, on each validation error, the `RequestValidator` will throw a `BadRequestError` with a `400` HTTP code.

##### For typescript project

```js
// Import module
import {RequestValidator} from '@ssense/restify-request-validator';
...
// Create restify server
const server = restify.createServer();
...
// Add middleware
const validator = new RequestValidator();
server.use(validator.validate.bind(validator));
```

Like for javascript initialization, you can pass a restify error handler in the constructor:
```js
const validator = new RequestValidator(restify.BadRequestError);
```

#### Validation

##### Example usage

Just add a `validation` param to the route to validate:
```js
function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

// Without validation
server.get('/hello/:name', respond);

// With validation
server.get({
    url: '/hello/:name',
    validation: {
        url: {
            name: {type: 'string', required: true, min: 3},
        },
    },
}, respond);
```

With this validation, the `name` param must be a string with minimum length of 3.

##### Validation object

The `validation` object accepts 3 optional properties:

* **url** to validate parameters in url path
* **query** to validate url query parameters
* **body** to validate request body parameters (useful for POST or PUT requests)

To validate inputs, just add properties to `url`, `query`, and/or `body` params with the following syntax :

```js
validation: {
    <url/query/body>: {
        <property_name>: {
            type: 'valid type', // required field, supported types are 'string', 'number', 'boolean', 'numeric', 'date', array', 'object'
            required: true|false, // optional, default false, determines is the parameter is required,
            min: 1, // optional, default 1, if 'type' property is 'string' or 'array', determines the minimum length, if 'type' parameter is 'number', determines the minimum value
            max: 5, // optional, default null, if 'type' property is 'string' or 'array', determines the maximum length, if 'type' parameter is 'number', determines the maximum value
            length: 3, // optional, default null, only works if 'type' property is 'string' or 'array', determines the required length,
            arrayType: 'valid type', // optional, default null, only works if 'type' property is 'array', check if the array content has valid types, supported types: 'string', 'number', 'boolean', 'numeric'
            values: ['value1', 'value2'], // optional, default null, validates that parameter value belongs to the provided list, if 'type' is 'array', validates every array element
            regex: /^Valid regex$/, // optional, default null, validates parameter value against provided regex
            terminal: true|false|['type', 'required', 'and so on...'] // optional, default false, when defined as 'true' or array of constraints, returns only error messages associated with this property_name and defined rules 
            format: function(data): data // Function to transform input after validation, see below for more detail
        }
    }
}
```

If you need to constrain the payload of the `url`, `query`, or `body` to the properties being validated, a parameter **disallowExtraFields** can be defined with the following syntax:

```js
validation: {
    <url/query/body>: {
        <property_name>: {
            // regular property validation as shown in the example above
        },
        disallowExtraFields: true|false // optional, default false, determines if the payload sent on the <url/query/body> should allow fields which are not present on the validation object
    }
}
```

#### Formatting data

##### Auto formatting

By default, every `numeric`, `date` and `boolean` inputs will be automatically transformed respectively to valid `number`, `Date` and `boolean` objects after validation. So you can directly use valid objects in your code.

##### Extra formatting, data transformation

If you need to add an extra formatting for one or several fields, just add the `format` parameter into your `validation` object. This parameter is a function with the following profile:

```js
format<T>(value: T): T;
```

Let's take an example:
For a given route, let's say we want to transform one parameter called `language` to lower case, it could be performed as this:

```js
server.get({
    url: '/posts/:language',
    validation: {
        url: {
            language: {type: 'string', required: true, format: function(value) { return value.toLowerCase(); }}, // For Javascript
            language: {type: 'string', required: true, format: (value: string) => value.toLowerCase()}, // For Typescript
        },
    },
}, respond);

```

With this parameter, if the validation succeeds, the `respond` method will always have a lower case `language` parameter, whatever the original input is.

#### Custom error messages

##### Example usage

You can pass custom error messages via the `validationMessages` param of the route:

```js
function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

server.get({
    url: '/hello/:name',
    validation: {
        url: {
            name: {type: 'string', required: true, min: 3},
        },
    },
    validationMessages: {
        name: {
            type: 'The name must be a string',
            required: 'The name is required',
            min: 'The name must have a minimum length of 3 characters'
        }
    },
}, respond);
```

#### Behavior

By default the validator will throw an error on the first validation failure, if you want to change this behavior to get all the validation errors, you can call the `disableFailOnFirstError` method on your `validator` object:

##### For javascript project

```js
// Require module
var restifyValidation = require('@ssense/restify-request-validator');
...
// Create restify server
var server = restify.createServer();
...
// Add middleware
var validator = new restifyValidation.RequestValidator();
validator.disableFailOnFirstError();
server.use(validator.validate.bind(validator));
```

##### For typescript project

```js
// Import module
import {RequestValidator} from '@ssense/restify-request-validator';
...
// Create restify server
const server = restify.createServer();
...
// Add middleware
const validator = new RequestValidator();
validator.disableFailOnFirstError();
server.use(validator.validate.bind(validator));
```

It is still possible to determine which errors should be returned individually when `disableFailOnFirstError` is activated. In order to do so, one should define the parameter `terminal` on each property being validated.

## Development

### Installation

To install the validator and get a proper development environment, clone/fork the current repository, then run the following command:

```
npm install
```

### Running the tests

* To check coding style (linting), run `npm run lint`
* To run the tests for the project, run `npm t`
* To run the tests with code coverage, run `npm run cover`, the result will be available in the folder `<your_project_dir>/tests/coverage/index.html`

## Deployment

Before each commit to this project, don't forget to build javascript files by running the following command:

```
npm run compile
```

## Authors

* **Rémy Jeancolas** - *Initial work* - [RemyJeancolas](https://github.com/RemyJeancolas)
* **Mickael Burguet** - *Add `disableFailOnFirstError` behavior* - [rundef](https://github.com/rundef)
* **Darlinton Prauchner** - *Add `disallowExtraFields` constraint* - [DarlintonPrauchner](https://github.com/DarlintonPrauchner)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
