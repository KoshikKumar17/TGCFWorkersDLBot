/**
 * Browser polyfills required by teleproto (MTProto client for JS).
 * Must be loaded BEFORE any teleproto imports.
 */
import { Buffer } from 'buffer';

// teleproto expects Node.js globals
globalThis.Buffer = Buffer;
window.Buffer = Buffer;

// Minimal process shim for teleproto
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    version: 'v18.0.0',
    browser: true,
    nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
  };
}

// Patch setTimeout/setInterval to add .unref() (Node.js-only method)
// teleproto uses setTimeout(...).unref() which doesn't exist in browsers
const _origSetTimeout = globalThis.setTimeout;
const _origSetInterval = globalThis.setInterval;
globalThis.setTimeout = function(fn, ms, ...args) {
  const id = _origSetTimeout.call(this, fn, ms, ...args);
  if (typeof id === 'number') {
    // Return an object with unref/ref stubs for browser compatibility
    return { _id: id, unref() { return this; }, ref() { return this; }, [Symbol.toPrimitive]() { return this._id; } };
  }
  if (id && typeof id.unref !== 'function') {
    id.unref = () => id;
    id.ref = () => id;
  }
  return id;
};
globalThis.setTimeout.call = _origSetTimeout.call?.bind(_origSetTimeout);
globalThis.setTimeout.apply = _origSetTimeout.apply?.bind(_origSetTimeout);

globalThis.setInterval = function(fn, ms, ...args) {
  const id = _origSetInterval.call(this, fn, ms, ...args);
  if (typeof id === 'number') {
    return { _id: id, unref() { return this; }, ref() { return this; }, [Symbol.toPrimitive]() { return this._id; } };
  }
  if (id && typeof id.unref !== 'function') {
    id.unref = () => id;
    id.ref = () => id;
  }
  return id;
};
globalThis.setInterval.call = _origSetInterval.call?.bind(_origSetInterval);
globalThis.setInterval.apply = _origSetInterval.apply?.bind(_origSetInterval);
