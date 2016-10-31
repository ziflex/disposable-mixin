# disposable-mixin

> Explicit releasing resources

Mixin that brings 'IDisposable' implementation to your types.

[![npm version](https://badge.fury.io/js/disposable-mixin.svg)](https://www.npmjs.com/package/disposable-mixin)
[![Build Status](https://secure.travis-ci.org/ziflex/disposable-mixin.svg?branch=master)](http://travis-ci.org/ziflex/disposable-mixin)
[![Coverage Status](https://coveralls.io/repos/github/ziflex/disposable-mixin/badge.svg?branch=master)](https://coveralls.io/github/ziflex/disposable-mixin)

````sh
    npm install --save disposable-mixin
````

## Motivation

To write types that may free underlying resources explicitly like database connections, sockets and etc. by cleaning the references and invoking nested disposable objects.

## Usage

``disposable-mixin`` brings 2 methods:
- ``isDisposed`` returns value which indicates wther the object is already disposed
- ``dispose`` frees specified underlying resources and marks the object as disposed

The mixin comes as a factory function i.e. in order to get mixin it needs to invoke exported function.

````javascript

    import composeClass from 'compose-class';
    import DisposableMixin from 'disposable-mixin';

    const Class = composeClass({
        mixins: [
            DisposableMixin()
        ]
    });

````

It is done intentionally in order to be able to pass the list of resource names (keys or symbols) and finalize callback.

````javascript

    import Symbol from 'es6-symbol';
    import composeClass from 'compose-class';
    import DisposableMixin from 'disposable-mixin';

    const FIELDS = {
        items: Symbol('items')
    };

    const Class = composeClass({
        mixins: [
            DisposableMixin([FIELDS.items])
        ],

        constructor(items) {
            this[FIELDS.items] = items;
        },

        items() {
            return this[FIELDS.items];
        }
    });

    const instance = new Class(createManyObjects());

    console.log(instance.items()); // [Objects...]
    console.log(instance.isDisposed()); // false

    instance.dispose();

    console.log(instance.items()); // null
    console.log(instance.isDisposed()); // true

````

Finalize callback allows to handle more complex scenarios like calling 'close' methods on database connections, destroy native objects and etc.

````javascript
// connection.js
    import Symbol from 'es6-symbol';
    import _ from 'lodash';
    import composeClass from 'compose-class';
    import DisposableMixin from 'disposable-mixin';
    import { MongoClient } from 'mongodb';

    const FIELDS = {
        settings: Symbol('settings'),
        connection: Symbol('connection')
    };

    function finalize(instance) {
        if (instance[FIELDS.connection]) {
            instance.close();
        }
    }

    const ConnectionWrapper = composeClass({
        mixins: [
            DisposableMixin(_.values(FIELDS), finalize)
        ],

        constructor(settings) {
            this[FIELDS.settings] = settings;
        },

        open(cb) {
            if (this[FIELDS.connection]) {
                return process.nextTick(() => cb(null));
            }

            return MongoClient.connect(this[FIELDS.settings], (err, db) => {
                if (err) {
                    return cb(err);
                }

                this[FIELDS.connection] = db;

                return cb(null);
            });
        },

        collection(name) {
            return this[FIELDS.connection].collection(name);
        },

        close() {
            if (this[FIELDS.connection]) {
                this[FIELDS.connection].close();
            }
        }
    });

````

If a resource implements 'Disposable' interface, its ``dispose`` methods will be invoked.

````javascript
// repository.js

import Symbol from 'es6-symbol';
import _ from 'lodash';
import composeClass from 'compose-class';
import DisposableMixin from 'disposable-mixin';
import { MongoClient } from 'mongodb';

const FIELDS = {
    connection: Symbol('connection')
};

const Repository = composeClass({
    mixins: [
        DisposableMixin(_.values(FIELDS))
    ],

    constructor(connection) {
        this[FIELDS.connection] = connection;
    },

    findAll(cb) {
        const cursor = this[FIELDS.connection].collection('restaurants').find();
        cursor.each(cb);

        return this;
    }
});

````

If we call ``dispose`` method of the repository instance, connection will be disposed automatically. Therefore, we can easily build deeply nested objects without worring about possible memory leaks.
