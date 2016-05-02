
{ isType, assert, assertType } = require "type-utils"
{ spawnSync } = require "child_process"

syncFs = require "io/sync"
Path = require "path"
Q = require "q"

module.exports = (command, args, options) ->

  if isType args, Object
    options = args
    args = null

  unless isType args, Array
    # TODO: Detect escaped spaces.
    args = command.split " "
    command = args.shift()

  options ?= {}
  args ?= []

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
