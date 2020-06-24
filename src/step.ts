export interface Step {
  finished:
    | ((next: () => any) => any)
    | Promise<any>
    | number
    | string
    | boolean
  cancel: () => any
}
