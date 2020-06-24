import type { Handler } from './handler'
import type { Step } from './step'
import { isGenerator } from './handlers/generator'
import { isPromise } from './handlers/promise'
import { isFunction } from './handlers/function'

type TransitionHandlersOpts = {
  includeDefault?: boolean
}

export class TransitionHandler {
  static handlers: Handler<any>[] = []
  handlers: Handler<any>[]
  opts: TransitionHandlersOpts
  current = new Set<Step>()

  constructor(
    handlers: Handler<any>[] = [],
    opts: TransitionHandlersOpts = {}
  ) {
    let { includeDefault = true, ...rest } = opts
    this.handlers = handlers
    this.opts = { includeDefault, ...rest }
  }

  static use<T>(handler: Handler<T>) {
    TransitionHandler.handlers.push(handler)
    return this
  }

  use<T>(handler: Handler<T>) {
    this.handlers.push(handler)
    return this
  }

  /* Searches through the handlers and includes */
  findHandler(step: any) {
    let found = this.handlers.find((handler) => handler.test(step))
    if (found) return found
    if (this.opts.includeDefault) {
      return TransitionHandler.handlers.find((h) => h.test(step))
    }
  }

  invalidate() {
    this.current.forEach((step) => {
      step.cancel()
    })
    this.current = new Set()
  }

  static wrap<CB extends (...args: any[]) => any>(
    callback: CB,
    opts?: TransitionHandlersOpts
  ) {
    let transitionHandler = new TransitionHandler([], opts)
    let fn = (transitionHandler.wrap(callback) as unknown) as (() => any) & {
      invalidate(): any
    }
    fn.invalidate = () => transitionHandler.invalidate()
    return fn
  }

  run(generator) {
    /* We can just return the value when it isn't generator like   */
    if (!isGenerator(generator)) return generator

    let current

    return new Promise((resolve) => {
      let runNext = (param?) => {
        let yielded = generator.next(param)

        if (yielded.done) {
          this.current.delete(current)
          return resolve(yielded.value)
        }

        let { value } = yielded

        let handler

        for (let stepHandler of this.handlers) {
          if (stepHandler.test(value)) {
            handler = stepHandler
            break
          }
        }

        if (!handler) {
          for (let stepHandler of TransitionHandler.handlers) {
            if (stepHandler.test(value)) {
              handler = stepHandler
              break
            }
          }
        }

        if (handler) {
          let process = handler.handle(value, this)

          /* Patch the cancel method to run genny.return */
          let { cancel } = process
          process.cancel = (...args) => {
            cancel(...args)
            resolve(generator.return?.())
            this.current.delete(current)
            current = null
          }

          current = process
          this.current.add(current)

          if (isPromise(process.finished)) {
            process.finished.then((param) => {
              runNext(param)
            })
          } else if (isFunction(process.finished)) {
            /* Allow callbacks so we can have syncronous yields */
            process.finished((value) => {
              runNext(value)
            })
          } else {
            runNext(value)
          }
        }
      }
      runNext()
    })
  }

  wrap<CB extends (...args: any[]) => any>(callback: CB) {
    if (!callback) return () => 'NO callback'
    /* 
    Async functions are sync until they hit an await, so we wan't to avoid 
    awaiting for as long as possible
    */
    let fn = (((...args: Parameters<CB>): Promise<ReturnType<CB>> => {
      /* Cancel the previously running step */
      this.invalidate()
      let genny = callback(...args)
      return this.run(genny)
    }) as unknown) as (() => any) & { invalidate: () => any }

    fn.invalidate = () => {
      this.invalidate()
    }

    return fn
  }

  handle(step: any) {
    const handler = this.findHandler(step)
    if (!handler) return
    return handler.handle(step)
  }
}
