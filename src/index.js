import Symbol from 'es6-symbol';

const IS_DISPOSED = Symbol('isDisposed');
const isArray = Array.isArray;

function isObject(target) {
    return typeof target === 'object';
}

function isArguments(target) {
    return isObject(target) &&
        typeof target.length === 'number' &&
        hasOwnProperty.call(target, 'callee');
}

function isFunction(i) {
    return typeof i === 'function';
}

function forEach(collection, iteratee, inherited = false) {
    if (!collection) {
        return null;
    }

    if (isArray(collection) || isArguments(collection)) {
        let index = -1;
        const length = collection.length;

        while (++index < length) {
            if (iteratee(collection[index], index, collection) === false) {
                break;
            }
        }
    } else if (isObject(collection)) {
        for (const key in collection) {
            if ((inherited || hasOwnProperty.call(collection, key)) && key !== 'constructor') {
                if (iteratee(collection[key], key, collection) === false) {
                    break;
                }
            }
        }
    }

    return collection;
}

function keys(object) {
    const result = [];

    forEach(object, (value, key) => {
        result.push(key);
    });

    return result;
}

function isDisposable(object) {
    if (!object) {
        return false;
    }

    return isFunction(object.dispose) && isFunction(object.isDisposed);
}

function disposeResources(object, resources) {
    const target = object;
    forEach(resources, (key) => {
        const resource = target[key];

        if (isDisposable(resource)) {
            if (!resource.isDisposed()) {
                resource.dispose();
            }
        }

        target[key] = null;
    });
}

function disposeObject(object) {
    if (isDisposable(object)) {
        if (!object.isDisposed()) {
            object.dispose();
        }

        return;
    }

    disposeResources(object, keys(object));
}

function constructor() {
    this[IS_DISPOSED] = false;
}

function isDisposed() {
    return this[IS_DISPOSED];
}

function Mixin(resources, finalize) {
    return {
        constructor,

        isDisposed,

        dispose() {
            if (this[IS_DISPOSED]) {
                return this;
            }

            if (isFunction(finalize)) {
                finalize(this);
            }

            disposeResources(this, resources);

            this[IS_DISPOSED] = true;

            return this;
        }
    };
}

Mixin.dispose = disposeObject;
Mixin.isDisposed = (target) => {
    return target ? isDisposed.apply(target) : true;
};
Mixin.disposeResources = disposeResources;
Mixin.isDisposable = isDisposable;

module.exports = Mixin;
