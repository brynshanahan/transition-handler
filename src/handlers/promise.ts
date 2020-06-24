import { createHandler } from '../handler'

export function isPromise(x): x is Promise<any> {
  return x && x.then && x.catch
}

export const PromiseHanlder = createHandler({
  test: isPromise,
  handle: (promise) => {
    let isCancelled = false
    return {
      finished: (next) => {
        promise.then(() => {
          if (!isCancelled) next()
        })
      },
      cancel() {
        isCancelled = true
      },
    }
  },
})
