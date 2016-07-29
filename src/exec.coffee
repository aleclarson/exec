
childProcess = require "child_process"
assertTypes = require "assertTypes"
assertType = require "assertType"
Promise = require "Promise"
syncFs = require "io/sync"
isType = require "isType"
assert = require "assert"
Path = require "path"

exports.async = (command, args, options) ->
  if isType args, Object
    options = args
    args = null
  else options ?= {}
  return exec command, args, options

exports.sync = (command, args, options) ->
  if isType args, Object
    options = args
    args = null
  else options ?= {}
  options.sync = yes
  return exec command, args, options

optionTypes =
  cwd: String.Maybe
  encoding: String.Maybe

exec = (command, lastArgs, options) ->

  # TODO: Detect escaped spaces.
  firstArgs = command.split " "
  command = firstArgs.shift()

  assertType command, String
  assertType lastArgs, Array if lastArgs?
  assertTypes options, optionTypes

  options.cwd ?= process.cwd()
  options.encoding ?= "utf8"

  assertType options.cwd, String

  unless Path.isAbsolute options.cwd
    options.cwd = Path.resolve process.cwd(), options.cwd

  assert syncFs.isDir(options.cwd), "'options.cwd' must be a directory!"

  args = firstArgs

  if lastArgs and lastArgs.length
    args = args.concat lastArgs

  if args.length
    command += " " + args.join " "

  if options.sync

    proc = childProcess.spawnSync command, options

    if proc.stderr.length is 0
      return trim proc.stdout

    throw Error trim proc.stderr

  deferred = Promise.defer()

  proc = childProcess.exec command, options, (error, stdout, stderr) ->

    if error
      return deferred.reject error

    if stderr.length is 0
      return deferred.resolve trim stdout

    return deferred.reject Error trim stderr

  return deferred.promise

# Trims trailing newlines.
trim = (string) -> string.replace /[\r\n]+$/, ""
