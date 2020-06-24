import { createHandler } from '../handler'
import { Step } from '../step'

function isStep(x): x is Step {
  return x.finished && x.cancel
}
export const StepHandler = createHandler({
  test: isStep,
  handle(step) {
    return step
  },
})
