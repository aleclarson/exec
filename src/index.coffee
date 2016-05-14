
{ spawnSync } = require "child_process"

assertType = require "assertType"
syncFs = require "io/sync"
isType = require "isType"
assert = require "assert"
Path = require "path"
Q = require "q"

module.exports = (command, args, options) ->

  if isType args, Object
    options = args
    args = null
  else options ?= {}

  # TODO: Detect escaped spaces.
  argsFromCommand = command.split " "
  command = argsFromCommand.shift()

  if argsFromCommand.length
    args = argsFromCommand.concat args or []
  else args ?= []

  assertType command, String
  assertType args, Array
  assertType options, Object

  options.cwd ?= process.cwd()
  options.encoding ?= "utf8"

  assertType options.cwd, String

  unless Path.isAbsolute options.cwd
    options.cwd = Path.resolve process.cwd(), options.cwd

  assert syncFs.isDir(options.cwd), "'options.cwd' must be a directory!"

  Q.try ->

    proc = spawnSync command, args, options

    if proc.stderr.length > 0
      throw Error proc.stderr.replace /[\r\n]+$/, ""

    return proc.stdout.replace /[\r\n]+$/, ""
