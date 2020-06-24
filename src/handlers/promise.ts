import { createHandler } from '../handler'

export function isPromise(x): x is Promise<any> {
  return x && x.then && x.catch
}

export const PromiseHandler = createHandler({
  test: isPromise,
  handle: (promise) => {
    let isCancelled = false
    return {
      finished: (next) => {
        promise.then((result) => {
          if (!isCancelled) next(result)
        })
      },
      cancel() {
        isCancelled = true
      },
    }
  },
})
