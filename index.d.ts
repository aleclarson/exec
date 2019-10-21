import { SpawnOptions } from "child_process"

/** Execute a shell command asynchronously */
declare const exec: exec.Exec & {
  /** Execute a shell command synchronously */
  sync: exec.SyncExec
  /** Execute a shell command asynchronously */
  async: exec.Exec
}

declare namespace exec {
  export type Exec = (cmd: string, ...args: Args) => Promise<string>
  export type Args = Array<Argv | Options | Listener>

  // Synchronous version
  export type SyncExec = (cmd: string, ...args: SyncArgs) => string
  export type SyncArgs = Array<Argv | Options>

  // Argument types
  export type Arg = string | null | undefined
  export type Argv = Array<Arg | Arg[]>
  export type Options = SpawnOptions
  export type Listener = (stderr: string, stdout: string) => void
}

export = exec
