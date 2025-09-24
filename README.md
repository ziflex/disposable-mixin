# disposable-mixin

> Explicitly releasing resources for better memory management

A lightweight JavaScript mixin that brings the Disposable pattern implementation to your classes, enabling explicit resource cleanup and preventing memory leaks in complex object hierarchies.

[![npm version](https://badge.fury.io/js/disposable-mixin.svg)](https://www.npmjs.com/package/disposable-mixin)
[![Build Status](https://secure.travis-ci.org/ziflex/disposable-mixin.svg?branch=master)](http://travis-ci.org/ziflex/disposable-mixin)
[![Coverage Status](https://coveralls.io/repos/github/ziflex/disposable-mixin/badge.svg?branch=master)](https://coveralls.io/github/ziflex/disposable-mixin)

## Installation

```sh
npm install --save disposable-mixin
```

## Motivation

Modern JavaScript applications often work with resources that need explicit cleanup - database connections, file handles, timers, event listeners, or large data structures. Without proper disposal, these resources can cause memory leaks and performance issues.

The Disposable pattern provides a standardized way to:
- **Explicitly release resources** when they're no longer needed
- **Prevent memory leaks** in complex object hierarchies  
- **Cascade disposal** through nested disposable objects
- **Ensure consistent cleanup** across your application

This mixin implements the Disposable pattern for any class, making resource management predictable and automatic.

## Quick Start

```javascript
import composeClass from 'compose-class';
import DisposableMixin from 'disposable-mixin';

// Basic usage - dispose all properties
const MyClass = composeClass({
    mixins: [DisposableMixin()],
    
    constructor(data) {
        this.data = data;
        this.cache = new Map();
    }
});

const instance = new MyClass({ items: [] });
console.log(instance.isDisposed()); // false

instance.dispose();
console.log(instance.isDisposed()); // true
console.log(instance.data); // null
console.log(instance.cache); // null
```

## API Reference

### DisposableMixin([resources], [finalizeCallback])

Factory function that returns a mixin with disposal capabilities.

**Parameters:**
- `resources` *(Array, optional)*: Array of property names (strings or symbols) to dispose. If omitted, all enumerable properties will be disposed.
- `finalizeCallback` *(Function, optional)*: Custom cleanup function called before resource disposal.

**Returns:** Object with constructor, isDisposed, and dispose methods.

### Instance Methods

#### `.isDisposed(): boolean`

Returns whether the object has been disposed.

```javascript
const obj = new DisposableClass();
console.log(obj.isDisposed()); // false
obj.dispose();
console.log(obj.isDisposed()); // true
```

#### `.dispose(): this`

Disposes the object and its resources. Can be called multiple times safely.

**Disposal process:**
1. Check if already disposed (returns early if true)
2. Call finalize callback if provided
3. Dispose specified resources or all enumerable properties
4. Set resources to `null`
5. Mark object as disposed

```javascript
obj.dispose(); // First call: performs cleanup
obj.dispose(); // Subsequent calls: safe no-op
```

### Static Methods

#### `DisposableMixin.dispose(object)`

Disposes any object, whether it implements the Disposable interface or not.

```javascript
const obj = { data: [], cache: new Map() };
DisposableMixin.dispose(obj);
// obj.data and obj.cache are now null
```

#### `DisposableMixin.isDisposed(object): boolean`

Checks if an object is disposed. Returns `true` for `null`/`undefined`.

```javascript
DisposableMixin.isDisposed(null); // true
DisposableMixin.isDisposed(disposedObj); // true/false based on state
```

#### `DisposableMixin.disposeResources(object, resources)`

Disposes specific resources of an object.

```javascript
const obj = { a: [], b: {}, c: 'keep' };
DisposableMixin.disposeResources(obj, ['a', 'b']);
// obj.a and obj.b are null, obj.c remains unchanged
```

#### `DisposableMixin.isDisposable(object): boolean`

Checks if an object implements the Disposable interface.

```javascript
DisposableMixin.isDisposable(disposableInstance); // true
DisposableMixin.isDisposable(regularObject); // false
```

## Usage Patterns

### Selective Resource Disposal

Specify which properties to dispose:

```javascript
import Symbol from 'es6-symbol';

const FIELDS = {
    connection: Symbol('connection'),
    cache: Symbol('cache'),
    config: Symbol('config') // Keep this
};

const DatabaseService = composeClass({
    mixins: [
        DisposableMixin([FIELDS.connection, FIELDS.cache])
    ],

    constructor(config) {
        this[FIELDS.config] = config;
        this[FIELDS.connection] = null;
        this[FIELDS.cache] = new Map();
    },

    connect() {
        // Connection logic
        this[FIELDS.connection] = createConnection(this[FIELDS.config]);
    }
});

const service = new DatabaseService({ host: 'localhost' });
service.connect();

service.dispose();
// connection and cache are disposed, config remains
console.log(service[FIELDS.config]); // { host: 'localhost' }
```

### Custom Finalization

Handle complex cleanup scenarios:

```javascript
const FIELDS = {
    connection: Symbol('connection'),
    timers: Symbol('timers')
};

function finalize(instance) {
    // Custom cleanup before disposal
    if (instance[FIELDS.connection]) {
        instance[FIELDS.connection].close();
    }
    
    if (instance[FIELDS.timers]) {
        instance[FIELDS.timers].forEach(timer => clearTimeout(timer));
    }
}

const Service = composeClass({
    mixins: [
        DisposableMixin(Object.values(FIELDS), finalize)
    ],

    constructor() {
        this[FIELDS.connection] = createConnection();
        this[FIELDS.timers] = [];
    },

    scheduleTask(fn, delay) {
        const timer = setTimeout(fn, delay);
        this[FIELDS.timers].push(timer);
    }
});
```

### Nested Disposable Objects

Automatic disposal of nested disposables:

```javascript
const User = composeClass({
    mixins: [DisposableMixin(['profile', 'sessions'])],
    
    constructor(userData) {
        this.profile = new UserProfile(userData.profile);
        this.sessions = userData.sessions.map(s => new UserSession(s));
    }
});

const UserProfile = composeClass({
    mixins: [DisposableMixin()],
    
    constructor(profileData) {
        this.avatar = profileData.avatar;
        this.preferences = new Map(profileData.preferences);
    }
});

const user = new User({
    profile: { avatar: 'avatar.jpg', preferences: [['theme', 'dark']] },
    sessions: [{ id: 1 }, { id: 2 }]
});

user.dispose();
// Automatically disposes:
// - user.profile (UserProfile instance)
// - user.sessions (array of UserSession instances)
// - All nested disposable objects recursively
```

## The Disposable Interface

Objects implementing the Disposable interface must provide:

```javascript
interface Disposable {
    isDisposed(): boolean;
    dispose(): this;
}
```

The mixin automatically detects and properly disposes nested objects that implement this interface.

## Best Practices

### 1. Use Symbols for Private Fields

```javascript
const PRIVATE = {
    connection: Symbol('connection'),
    cache: Symbol('cache')
};

// Symbols prevent accidental access and naming conflicts
```

### 2. Implement Idempotent Disposal

```javascript
dispose() {
    if (this.isDisposed()) {
        return this; // Safe to call multiple times
    }
    // ... disposal logic
}
```

### 3. Clean Up in Finalize Callbacks

```javascript
function finalize(instance) {
    // Close connections, clear timers, remove listeners
    if (instance.connection) {
        instance.connection.close();
    }
    
    if (instance.intervalId) {
        clearInterval(instance.intervalId);
    }
}
```

### 4. Dispose in Reverse Order

When manually disposing resources, clean up in reverse order of creation:

```javascript
// Last created, first disposed
this.closeConnections();
this.clearCaches();
this.removeListeners();
```

### 5. Check Disposed State

```javascript
getData() {
    if (this.isDisposed()) {
        throw new Error('Cannot access disposed object');
    }
    return this.data;
}
```

## Error Handling

The mixin handles disposal errors gracefully:

- **Multiple disposal calls**: Safe no-op after first disposal
- **Null/undefined resources**: Safely ignored
- **Failed nested disposal**: Continues disposing other resources
- **Missing dispose methods**: Objects are set to null

```javascript
// Even if some nested objects fail to dispose,
// the parent object will still be marked as disposed
obj.dispose(); // Never throws, always completes
```

## Performance Considerations

- **Minimal overhead**: Only adds disposal state tracking
- **Lazy evaluation**: No performance cost until disposal
- **Memory efficient**: Nullifies references to enable garbage collection
- **Non-blocking**: Disposal is synchronous but fast

## Browser & Node.js Compatibility

- **Node.js**: All versions with ES5+ support
- **Browsers**: IE9+, Chrome, Firefox, Safari, Edge
- **Module systems**: CommonJS, ES6 modules, AMD
- **Dependencies**: Only `es6-symbol` for Symbol polyfill

## Common Patterns

### Singleton with Cleanup

```javascript
class DatabaseManager {
    static instance = null;
    
    static getInstance() {
        if (!this.instance || this.instance.isDisposed()) {
            this.instance = new DatabaseManager();
        }
        return this.instance;
    }
    
    dispose() {
        super.dispose();
        DatabaseManager.instance = null;
    }
}
```

### Resource Pool

```javascript
class ConnectionPool extends DisposableMixin(['connections']) {
    constructor(size) {
        super();
        this.connections = Array(size).fill(null).map(() => createConnection());
    }
    
    getConnection() {
        if (this.isDisposed()) {
            throw new Error('Pool is disposed');
        }
        return this.connections.find(conn => conn.isAvailable());
    }
}
```

### Event Emitter Cleanup

```javascript
const EventEmitterMixin = composeClass({
    mixins: [DisposableMixin()],
    
    constructor() {
        this.listeners = new Map();
    },
    
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    },
    
    finalize() {
        // Clean up all event listeners
        this.listeners.clear();
    }
});
```

## Troubleshooting

### Common Issues

**Q: My objects aren't being disposed properly**
```javascript
// ❌ Wrong: Resources not specified
DisposableMixin() // Disposes ALL enumerable properties

// ✅ Correct: Specify resources to dispose
DisposableMixin(['connection', 'cache'])
```

**Q: Getting errors after disposal**
```javascript
// ❌ Wrong: Not checking disposed state
getData() {
    return this.data; // May be null after disposal
}

// ✅ Correct: Guard against disposed state
getData() {
    if (this.isDisposed()) {
        throw new Error('Object is disposed');
    }
    return this.data;
}
```

**Q: Finalize callback not called**
```javascript
// ❌ Wrong: Missing finalize parameter
DisposableMixin(['resources']) 

// ✅ Correct: Include finalize callback
DisposableMixin(['resources'], finalizeCallback)
```

## Migration Guide

### From manual cleanup:

```javascript
// Before
class MyClass {
    dispose() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.cache) {
            this.cache.clear();
            this.cache = null;
        }
        this.disposed = true;
    }
}

// After
const MyClass = composeClass({
    mixins: [DisposableMixin(['connection', 'cache'], (instance) => {
        if (instance.connection) instance.connection.close();
        if (instance.cache) instance.cache.clear();
    })]
});
```

## License

MIT © Tim Voronov
