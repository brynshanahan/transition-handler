import { createHandler } from '../handler'

function isNumber(x): x is number {
  return typeof x == 'number'
}

export const NumberHandler = createHandler({
  test: isNumber,
  handle(time) {
    let tm
    return {
      finished: (next) => {
        if (time > 0) {
          setTimeout(next, time)
        } else {
          next()
        }
      },
      cancel: () => clearTimeout(tm),
    }
  },
})
