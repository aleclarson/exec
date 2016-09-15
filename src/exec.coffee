
childProcess = require "child_process"
assertTypes = require "assertTypes"
assertType = require "assertType"
Promise = require "Promise"
isType = require "isType"
path = require "path"
fs = require "io/sync"

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

  if not options.cwd
    options.cwd = process.cwd()

  else if not path.isAbsolute options.cwd
    options.cwd = path.resolve options.cwd

  if not fs.isDir options.cwd
    throw Error "'options.cwd' must be a directory:\n  #{options.cwd}"

  args = firstArgs

  if lastArgs and lastArgs.length
    args = args.concat lastArgs

  # if args.length
  #   command += " " + args.join " "

  if options.sync
    spawnSync command, args, options
  else spawnAsync command, args, options

spawnSync = (command, args, options) ->

  proc = childProcess.spawnSync command, args, options

  if proc.error
    throw proc.error

  if proc.stderr.length is 0
    return trim proc.stdout

  throw Error trim proc.stderr

spawnAsync = (command, args, options) ->

  deferred = Promise.defer()

  stdout = []
  stderr = []

  proc = childProcess.spawn command, args, options

  proc.on "error", (error) ->
    deferred.reject error

  proc.stdout.on "data", (data) ->
    stdout.push data

  proc.stderr.on "data", (data) ->
    stderr.push data

  proc.on "close", (code) ->
    if stderr.length
    then deferred.reject Error trim stderr.join ""
    else deferred.resolve trim stdout.join ""

  return deferred.promise

# Trims trailing newlines.
trim = (string) -> string.replace /[\r\n]+$/, ""
