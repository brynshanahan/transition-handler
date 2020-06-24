import {
  TransitionHandler,
  installAll,
  NumberHandler,
  PromiseHandler,
  RafHandler,
} from '../src'
let handler = new TransitionHandler()

describe('Transition Handler', () => {
  test('Wrapped normal functions return instantly', () => {
    let callback = new TransitionHandler().wrap(function () {
      return false
    })
    expect(callback()).toBe(false)
  })

  test('Wrapped async functions to cancel', async () => {
    let callback = new TransitionHandler()
      .use(PromiseHandler)
      .wrap(async function () {})

    let calls = 0
    callback().then(() => calls++)
    await callback().then(() => calls++)

    expect(calls).toBe(1)
  })

  test('Wrapped generators return promises', () => {
    let transitionHandler = new TransitionHandler().use(NumberHandler)

    let callback = transitionHandler.wrap(function* () {})

    let result = callback()
    expect(result).toBeInstanceOf(Promise)
  })

  test('Code before a yield runs in sync', async () => {
    let transitionHandler = new TransitionHandler().use(NumberHandler)

    let calls = 0
    let callback = transitionHandler.wrap(function* () {
      calls++
      yield 0
      calls++
    })

    expect(calls).toBe(0)
    let result = callback()
    expect(calls).toBe(1)
    await result
    expect(calls).toBe(2)
  })

  test('Successfully cleans up previous calls', async () => {
    let transitionHandler = new TransitionHandler().use(NumberHandler)

    let calls = 0
    let callback = transitionHandler.wrap(function* () {
      yield 0
      calls++
    })

    callback()
    callback()
    await callback()
    expect(calls).toBe(1)
  })

  test('Sibling callbacks cancel each other', async () => {
    let transitionHandler = new TransitionHandler().use(NumberHandler)

    let state = 'none'
    let calls = 0
    let transitionIn = transitionHandler.wrap(function* () {
      yield 0
      state = 'in'
      calls++
    })
    let trasnitionOut = transitionHandler.wrap(function* () {
      yield 0
      state = 'out'
      calls++
    })

    transitionIn()
    await trasnitionOut()

    expect(state).toBe('out')
    expect(calls).toBe(1)
  })

  test('Yeilding a number waits the appropriate time', async () => {
    let handler = new TransitionHandler().use(NumberHandler)

    let elapsedTime = 0

    let callback = handler.wrap(function* () {
      let now = Date.now()
      yield 300
      elapsedTime = Date.now() - now
    })

    await callback()

    expect(elapsedTime).toBeGreaterThanOrEqual(300)
  })

  test('Yielding raf waits a raf amount of time', async () => {
    let handler = new TransitionHandler().use(RafHandler)

    let elapsedTime = 0
    let i = 0
    let callback = handler.wrap(function* () {
      let now = Date.now()
      yield requestAnimationFrame
      i++
      elapsedTime = Date.now() - now
    })

    handler.current

    callback()

    expect(i).toBe(1)
  })
})
