const { spawn, spawnSync } = require('child_process')
const TypeError = require('type-error')
const quotes = require('shell-quote')
const fs = require('fs')

function execAsync(...args) {
  return exec(false, ...args)
}

function execSync(...args) {
  return exec(true, ...args)
}

module.exports = execAsync
module.exports.sync = execSync
module.exports.async = execAsync

//
// Helpers
//

const trailingNewlines = /[\r\n]+$/

function stripTrailingNewlines(str) {
  if (typeof str == 'string') {
    return str.replace(trailingNewlines, '')
  } else return str
}

function isDir(dir) {
  try {
    return fs.statSync(dir).isDirectory()
  } catch (e) {
    return false
  }
}

function exec(sync, cmd, ...args) {
  if (typeof cmd !== 'string') {
    throw TypeError(String, cmd)
  }

  cmd = quotes.parse(cmd)

  const opts = {}
  args.forEach(arg => {
    if (arg == null) return
    if (arg.constructor == Object) {
      Object.assign(opts, arg)
    } else if (Array.isArray(arg)) {
      arg.forEach(arg => {
        if (arg == null) return
        if (Array.isArray(arg)) {
          arg.forEach(arg => cmd.push(String(arg)))
        } else {
          cmd.push(String(arg))
        }
      })
    } else if (!sync && typeof arg == 'function') {
      opts.listener = arg
    } else {
      cmd.push(String(arg))
    }
  })

  if (opts.cwd && !isDir(opts.cwd)) {
    const error = Error('Directory does not exist: ' + opts.cwd)
    error.code = 'ENOTDIR'
    throw error
  }

  // Default to utf8 string.
  opts.encoding || (opts.encoding = 'utf8')

  if (sync) {
    const proc = spawnSync(cmd[0], cmd.slice(1), opts)
    if (proc.error) {
      if (proc.error.code == 'ENOENT') {
        proc.error.message = 'Unknown command: ' + cmd
      }
      throw proc.error
    }
    if (isFailure(proc, opts)) {
      const msg = proc.stderr
        ? stripTrailingNewlines(proc.stderr)
        : 'Closed with non-zero exit code: ' + proc.status

      const error = new Error(msg)
      error.exitCode = proc.status
      throw error
    }
    return stripTrailingNewlines(proc.stdout)
  } else {
    // Capture a useful stack trace.
    const error = new Error()
    const proc = spawn(cmd[0], cmd.slice(1), opts)
    return bindPromise(proc, setupAsync(proc, cmd, opts, error))
  }
}

function bindPromise(obj, promise) {
  obj.then = promise.then.bind(promise)
  obj.catch = promise.catch.bind(promise)
  if (promise.finally) {
    obj.finally = promise.finally.bind(promise)
  }
  return obj
}

function setupAsync(proc, cmd, opts, error) {
  return new Promise((resolve, reject) => {
    let rejected = false
    proc.on('error', e => {
      Object.assign(error, e)
      error.message = e.code == 'ENOENT' ? 'Unknown command: ' + cmd : e.message

      rejected = true
      reject(error)
    })

    if (opts.listener) {
      if (proc.stdout) {
        proc.stdout.on('data', data => opts.listener(null, data))
        proc.stdout.setEncoding(opts.encoding)
      } else if (!proc.stderr) {
        throw Error('Cannot listen when both stdout and stderr are missing')
      }
      if (proc.stderr) {
        proc.stderr.on('data', opts.listener)
        proc.stderr.setEncoding(opts.encoding)
      }
      proc.on('close', status => {
        if (rejected) return
        if (isFailure({ status }, opts)) {
          error.message = 'Closed with non-zero exit code: ' + status
          error.exitCode = status
          reject(error)
        } else {
          resolve()
        }
      })
    } else {
      const stdout = [],
        stderr = []
      if (proc.stdout) {
        proc.stdout.on('data', data => stdout.push(data))
      }
      if (proc.stderr) {
        proc.stderr.on('data', data => stderr.push(data))
      }
      proc.on('close', status => {
        if (rejected) return
        if (isFailure({ status, stdout, stderr }, opts)) {
          error.message = stderr.length
            ? stripTrailingNewlines(stderr.join(''))
            : 'Closed with non-zero exit code: ' + status

          error.exitCode = status
          reject(error)
        } else {
          resolve(stripTrailingNewlines(stdout.join('')))
        }
      })
    }
  })
}

function isFailure(proc, opts) {
  if (proc.status == 0 || opts.noThrow === true) {
    return false
  }
  if (!opts.noThrow) {
    return true
  }

  let output =
    (proc.stderr && proc.stderr.length ? proc.stderr : proc.stdout) || ''

  if (Array.isArray(output)) {
    output = output.join('')
  } else {
    output = output.toString('utf8')
  }
  return !opts.noThrow.test(output)
}
