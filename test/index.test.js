/* eslint-disable global-require, no-unused-expressions, import/no-extraneous-dependencies */
import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import composeClass from 'compose-class';
import DisposableMixin from '../src/index';

describe('Mixin', () => {
    it('should dispose object', () => {
        const Class = composeClass({
            mixins: [
                DisposableMixin()
            ],

            constructor(name, age, dob, address) {
                this.name = name;
                this.age = age;
                this.dob = dob;
                this.address = address;
                this.values = [];
            }
        });

        const tom = new Class('Tom', 30, new Date(), {});
        const jerry = new Class('Jerry', 30, new Date(), {});

        expect(_.isFunction(tom.dispose)).to.be.true;
        expect(_.isFunction(tom.isDisposed)).to.be.true;

        expect(tom.isDisposed === tom.isDisposed).to.be.true;

        expect(tom.isDisposed()).to.be.false;
        expect(jerry.isDisposed()).to.be.false;

        tom.dispose();

        expect(tom.isDisposed()).to.be.true;
        expect(jerry.isDisposed()).to.be.false;
    });

    it('should dispose object and free resources', () => {
        const Class = composeClass({
            mixins: [
                DisposableMixin([
                    'name',
                    'age',
                    'dob',
                    'address',
                    'values'
                ])
            ],

            constructor(name, age, dob, address) {
                this.name = name;
                this.age = age;
                this.dob = dob;
                this.address = address;
                this.values = [];
            }
        });

        const tom = new Class('Tom', 30, new Date(), {});
        const jerry = new Class('Jerry', 30, new Date(), {});

        expect(_.isFunction(tom.dispose)).to.be.true;
        expect(_.isFunction(tom.isDisposed)).to.be.true;

        expect(tom.isDisposed === tom.isDisposed).to.be.true;

        expect(tom.isDisposed()).to.be.false;
        expect(jerry.isDisposed()).to.be.false;

        tom.dispose();

        expect(tom.isDisposed()).to.be.true;
        expect(jerry.isDisposed()).to.be.false;

        _.forEach(_.keys(tom), (key) => {
            expect(tom[key]).to.not.exist;
        });
    });

    it('should dispose nested disposable objects', () => {
        const User = composeClass({
            mixins: [
                DisposableMixin([
                    'name',
                    'address'
                ])
            ],

            constructor(name, address) {
                this.name = name;
                this.address = address;
            }
        });

        const Address = composeClass({
            mixins: [
                DisposableMixin([
                    'city',
                    'state',
                    'country'
                ])
            ],

            constructor(city, state, country) {
                this.city = city;
                this.state = state;
                this.country = country;
            }
        });

        const address = new Address('Emeryville', 'CA', 'USA');
        const mike = new User('Mike Wazowski', address);

        expect(mike.address.isDisposed()).to.be.false;
        expect(mike.isDisposed()).to.be.false;

        mike.dispose();

        expect(mike.isDisposed()).to.be.true;
        expect(mike.address).to.not.exist;
        expect(address.isDisposed()).to.be.true;
    });

    it('should dispose nested objects if they implement "Disposable" interface', () => {
        const User = composeClass({
            mixins: [
                DisposableMixin([
                    'name',
                    'address'
                ])
            ],

            constructor(name, address) {
                this.name = name;
                this.address = address;
            }
        });

        class Address {
            constructor(city, state, country) {
                this.city = city;
                this.state = state;
                this.country = country;
                this._disposed = false;
            }

            isDisposed() {
                return this._disposed;
            }

            dispose() {
                this._disposed = true;

                return this;
            }
        }

        const address = new Address('Emeryville', 'CA', 'USA');
        const mike = new User('Mike Wazowski', address);

        expect(mike.address.isDisposed()).to.be.false;
        expect(mike.isDisposed()).to.be.false;

        mike.dispose();

        expect(mike.isDisposed()).to.be.true;
        expect(mike.address).to.not.exist;
        expect(address.isDisposed()).to.be.true;
    });

    it('should invoke a given "finalize" callback', () => {
        const spy = sinon.spy();
        const User = composeClass({
            mixins: [
                DisposableMixin([
                    'name',
                    'children'
                ], spy)
            ],

            constructor(name) {
                this.name = name;
            }
        });

        const mike = new User('Mike Wazowski');

        mike.dispose();

        expect(spy.callCount).to.equal(1);
        expect(spy.args[0][0]).to.equal(mike);
    });

    it('should return instance', () => {
        const Class = composeClass({
            mixins: [
                DisposableMixin()
            ],

            constructor() {
            }
        });

        const instance = new Class();

        expect(instance.dispose()).to.equal(instance);
        expect(instance.dispose()).to.equal(instance);
    });
});

describe('Helpers', () => {
    describe('dispose', () => {
        context('When object does not implement "Disposable" interface', () => {
            it('should dispose object', () => {
                const obj = {
                    name: 'Mike Wazowski',
                    dob: new Date()
                };

                DisposableMixin.dispose(obj);

                _.forEach(_.keys(obj), (key) => {
                    expect(obj[key]).to.not.exist;
                });
            });

            it('should dispose nested disposable object', () => {
                const Address = composeClass({
                    mixins: [
                        DisposableMixin()
                    ],

                    constructor() {}
                });

                const address = new Address();
                const obj = {
                    name: 'Mike Wazowski',
                    dob: new Date(),
                    address
                };

                DisposableMixin.dispose(obj);

                expect(address.isDisposed()).to.be.true;
            });
        });

        context('When object does implement "Disposable" interface', () => {
            it('should dispose object', () => {
                const Class = composeClass({
                    mixins: [
                        DisposableMixin([
                            'name',
                            'age'
                        ])
                    ],

                    constructor(name, age) {
                        this.name = name;
                        this.age = age;
                    }
                });

                const u = new Class('Mike', 30);

                DisposableMixin.dispose(u);

                expect(u.isDisposed()).to.be.true;
            });
        });
    });

    describe('isDisposed', () => {
        it('should detect whether a given object is disposed', () => {
            expect(DisposableMixin.isDisposed(null)).to.be.true;

            const Class = composeClass({
                mixins: [
                    DisposableMixin()
                ]
            });

            const instance = new Class();

            expect(DisposableMixin.isDisposed(instance)).to.be.false;
            instance.dispose();
            expect(DisposableMixin.isDisposed(instance)).to.be.true;
        });
    });

    describe('disposeResources', () => {
        context('When resources are plain types', () => {
            it('should dispose object', () => {
                const obj = {
                    name: 'Mike Wazowski',
                    dob: new Date()
                };

                DisposableMixin.disposeResources(obj, ['name', 'dob']);

                _.forEach(_.keys(obj), (key) => {
                    expect(obj[key]).to.not.exist;
                });
            });
        });

        context('When resources are disposables', () => {
            it('should dispose object', () => {
                const Class = composeClass({
                    mixins: [
                        DisposableMixin([
                            'name'
                        ])
                    ],

                    constructor(name) {
                        this.name = name;
                    }
                });

                const firstName = new Class('Mike');
                const lastName = new Class('Wazowski');

                const obj = {
                    firstName,
                    lastName
                };

                DisposableMixin.disposeResources(obj, ['firstName', 'lastName']);

                expect(firstName.isDisposed()).to.be.true;
                expect(lastName.isDisposed()).to.be.true;
            });
        });
    });
});

it('should be exported as "commonjs" module', () => {
    const Mixin = require('../src/index');

    expect(typeof Mixin === 'function').to.be.true;
});
