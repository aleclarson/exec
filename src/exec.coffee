# TODO: Detect escaped spaces in the `command` argument.

childProcess = require "child_process"
assertValid = require "assertValid"
Promise = require "Promise"
path = require "path"
fs = require "fsx"

optionTypes =
  cwd: "string?"
  encoding: "string?"
  listener: "function?"

execAsync = (command, args, options) ->
  assertValid command, "string"

  if not Array.isArray args
    options = args
    args = []

  assertValid args, "array?"
  assertValid options ?= {}, optionTypes
  options.sync = false
  return exec command, args, options

execSync = (command, args, options) ->
  assertValid command, "string"

  if not Array.isArray args
    options = args
    args = []

  assertValid args, "array?"
  assertValid options ?= {}, optionTypes
  options.sync = true
  return exec command, args, options

module.exports = execAsync
module.exports.async = execAsync
module.exports.sync = execSync

#
# Helpers
#

trim = (string) ->
  return string.replace /[\r\n]+$/, ""

exec = (command, lastArgs, options) ->

  firstArgs = command.split " "
  command = firstArgs.shift()

  if not options.cwd
    options.cwd = process.cwd()

  else if not path.isAbsolute options.cwd
    options.cwd = path.resolve options.cwd

  if not fs.isDir options.cwd
    throw Error "'options.cwd' must be a directory:\n  #{options.cwd}"

  args =
    if lastArgs.length
    then firstArgs.concat lastArgs
    else firstArgs

  options.encoding ?= "utf8"

  if options.sync
  then spawnSync command, args, options
  else spawnAsync command, args, options

spawnSync = (command, args, options) ->

  proc = childProcess.spawnSync command, args, options

  if proc.error
    throw proc.error

  if proc.stderr.length is 0
    return trim proc.stdout

  throw Error trim proc.stderr

spawnAsync = (command, args, options) ->
  {promise, resolve, reject} = Promise.defer()

  proc = childProcess.spawn command, args, options

  if listener = options.listener
    proc.stdout.on "data", (data) -> listener null, data
    proc.stderr.on "data", listener
  else
    stdout = []
    stderr = []
    proc.stdout.on "data", (data) -> stdout.push data
    proc.stderr.on "data", (data) -> stderr.push data

  proc.on "error", reject
  proc.on "close", (code) ->
    return unless promise.isPending
    return resolve() if listener

    if stderr.length
    then reject Error trim stderr.join ""
    else resolve trim stdout.join ""

  return promise
