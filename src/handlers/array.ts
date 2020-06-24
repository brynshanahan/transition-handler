import { createHandler } from '../handler'
import { isGenerator } from './generator'
import { isPromise } from './promise'
import type { Step } from '../step'

export const ArrayHandler = createHandler({
  test: Array.isArray,
  handle(arr, handler) {
    let cancelled = false
    let steps: Step[] = []

    let all = arr.map((fn) => {
      let val = fn()
      if (isPromise(val)) {
        return new Promise((resolve) => {
          val.then((arg) => {
            if (!cancelled) resolve(arg)
          })
        })
      } else if (isGenerator(val)) {
        return handler.run(val)
      } else {
        let step = handler.handle(val)
        steps.push(step)
        return step.finished
      }
    })

    return {
      finished: Promise.all(all),
      cancel: () => {
        cancelled = true
        steps.forEach((step) => step.cancel())
      },
    }
  },
})
