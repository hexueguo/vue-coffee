/**
 * mycall
 * @param {any} ctx
 * @param  {...any} args
 * @returns
 */
Function.prototype.mycall = function (ctx, ...args) {
  const fn = this
  if (typeof fn !== 'function') {
    throw new TypeError('mycall not a function')
  }
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx)
  const sy = Symbol()
  Object.defineProperty(ctx, sy, {
    value: fn,
    writable: true,
    enumerable: false
  })

  const r = ctx[sy](...args)
  delete ctx[sy]
  return r
}
