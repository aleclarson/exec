declare const exec: {
  /** Execute a shell command asynchronously */
  (cmd: string, ...args: any[]): Promise<string>
  /** Execute a shell command synchronously */
  sync(cmd: string, ...args: any[]): string
  /** Execute a shell command asynchronously */
  async: typeof exec
}
export = exec
