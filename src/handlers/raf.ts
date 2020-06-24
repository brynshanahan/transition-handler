import { createHandler } from '../handler'

export function isRaf(x): x is Window['requestAnimationFrame'] {
  return x === window.requestAnimationFrame
}

/* 
Usage: yield window.requestAnimationFrame
*/
export const RafHandler = createHandler({
  test: isRaf,
  handle(requestAnimationFrame) {
    let frame
    return {
      finished: (next) => {
        frame = requestAnimationFrame(next)
      },
      cancel: () => {
        cancelAnimationFrame(frame)
      },
    }
  },
})
