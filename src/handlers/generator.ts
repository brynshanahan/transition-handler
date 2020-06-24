export function isGenerator(x: any): x is IterableIterator<any> {
  return typeof x?.next === 'function'
}
