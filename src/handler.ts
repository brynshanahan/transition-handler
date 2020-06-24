import type { Step } from './step'
import type { TransitionHandler } from './transition-handler'

export interface Handler<T> {
  test(arg): arg is T
  handle(arg: T, tHandler?: TransitionHandler): Step
}

export function createHandler<T>(handler: Handler<T>) {
  return handler
}
