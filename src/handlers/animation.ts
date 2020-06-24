import { Handler, createHandler } from '../handler'

function isAnimation(x): x is Animation {
  return x instanceof Animation
}

export const AnimationHandler = createHandler({
  test: isAnimation,
  handle(anim) {
    return {
      finished: anim.finished,
      cancel: anim.cancel,
    }
  },
})
