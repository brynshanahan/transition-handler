import { createHandler } from '../handler'

export function isFunction(x): x is Function {
  return typeof x === 'function'
}
export const FunctionHandler = createHandler({
  test: isFunction,
  handle(callback: (next: () => any) => any) {
    return {
      cancel: () => {},
      finished: callback,
    }
  },
})
