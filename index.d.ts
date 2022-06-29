import {
  ChildProcessWithoutNullStreams as ChildProcess,
  SpawnOptions,
  SpawnSyncOptions,
} from 'child_process'

/** Execute a shell command asynchronously */
declare const exec: exec.Exec & {
  /** Execute a shell command synchronously */
  sync: exec.SyncExec
  /** Execute a shell command asynchronously */
  async: exec.Exec
}

declare namespace exec {
  export interface Exec {
    (cmd: string, ...args: Args): ChildProcess & Promise<string>
  }

  type Extensions = {
    /**
     * When true, all non-zero exit codes are ignored. \
     * When a `RegExp` is given, the stderr (or stdout if stderr is empty)
     * is tested and matches are ignored.
     */
    noThrow?: RegExp | boolean
  }

  // Argument types
  export type Args = Array<Argv | Options | Listener>
  export type Argv = Array<Arg | Arg[]>
  export type Arg = string | null | undefined
  export type Listener = (stderr: string, stdout: string) => void
  export type Options = SpawnOptions & Extensions

  // Synchronous version
  export type SyncExec = (cmd: string, ...args: SyncArgs) => string
  export type SyncArgs = Array<Argv | SyncOptions>
  export type SyncOptions = SpawnSyncOptions & Extensions
}

export = exec
