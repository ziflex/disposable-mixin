// Type definitions for disposable-mixin
// Project: https://github.com/ziflex/disposable-mixin
// Definitions by: Tim Voronov <https://github.com/ziflex>

/**
 * Interface that objects must implement to be considered disposable
 */
export interface Disposable {
    /**
     * Returns whether the object has been disposed
     */
    isDisposed(): boolean;
    
    /**
     * Disposes the object and its resources
     * @returns The same instance for method chaining
     */
    dispose(): this;
}

/**
 * Mixin object returned by DisposableMixin factory
 */
export interface DisposableMixinObject {
    constructor(): void;
    isDisposed(): boolean;
    dispose(): this;
}

/**
 * Static methods available on the DisposableMixin function
 */
export interface DisposableMixinStatic {
    /**
     * Disposes any object, whether it implements Disposable interface or not
     * @param object Object to dispose
     */
    dispose(object: any): void;
    
    /**
     * Checks if an object is disposed. Returns true for null/undefined
     * @param object Object to check
     */
    isDisposed(object: any): boolean;
    
    /**
     * Disposes specific resources of an object
     * @param object Object containing resources
     * @param resources Array of resource names to dispose
     */
    disposeResources(object: any, resources: (string | symbol)[]): void;
    
    /**
     * Checks if an object implements the Disposable interface
     * @param object Object to check
     */
    isDisposable(object: any): object is Disposable;
}

/**
 * Finalize callback function type
 */
export type FinalizeCallback = (instance: any) => void;

/**
 * Factory function that creates a disposable mixin
 */
export interface DisposableMixinFactory {
    /**
     * Creates a disposable mixin
     * @param resources Optional array of resource names to dispose
     * @param finalize Optional finalize callback
     */
    (resources?: (string | symbol)[], finalize?: FinalizeCallback): DisposableMixinObject;
}

/**
 * Main DisposableMixin export
 */
declare const DisposableMixin: DisposableMixinFactory & DisposableMixinStatic;

export = DisposableMixin;