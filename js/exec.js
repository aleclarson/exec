// Generated by CoffeeScript 1.12.4
var Promise, assertType, assertTypes, childProcess, exec, fs, isType, optionTypes, path, spawnAsync, spawnSync, trim;

childProcess = require("child_process");

assertTypes = require("assertTypes");

assertType = require("assertType");

Promise = require("Promise");

isType = require("isType");

path = require("path");

fs = require("fsx");

exports.async = function(command, args, options) {
  if (isType(args, Object)) {
    options = args;
    args = null;
  } else {
    if (options == null) {
      options = {};
    }
  }
  return exec(command, args, options);
};

exports.sync = function(command, args, options) {
  if (isType(args, Object)) {
    options = args;
    args = null;
  } else {
    if (options == null) {
      options = {};
    }
  }
  options.sync = true;
  return exec(command, args, options);
};

optionTypes = {
  cwd: String.Maybe,
  encoding: String.Maybe
};

exec = function(command, lastArgs, options) {
  var args, firstArgs;
  firstArgs = command.split(" ");
  command = firstArgs.shift();
  assertType(command, String);
  if (lastArgs != null) {
    assertType(lastArgs, Array);
  }
  assertTypes(options, optionTypes);
  if (options.cwd == null) {
    options.cwd = process.cwd();
  }
  if (options.encoding == null) {
    options.encoding = "utf8";
  }
  if (!options.cwd) {
    options.cwd = process.cwd();
  } else if (!path.isAbsolute(options.cwd)) {
    options.cwd = path.resolve(options.cwd);
  }
  if (!fs.isDir(options.cwd)) {
    throw Error("'options.cwd' must be a directory:\n  " + options.cwd);
  }
  args = firstArgs;
  if (lastArgs && lastArgs.length) {
    args = args.concat(lastArgs);
  }
  if (options.sync) {
    return spawnSync(command, args, options);
  } else {
    return spawnAsync(command, args, options);
  }
};

spawnSync = function(command, args, options) {
  var proc;
  proc = childProcess.spawnSync(command, args, options);
  if (proc.error) {
    throw proc.error;
  }
  if (proc.stderr.length === 0) {
    return trim(proc.stdout);
  }
  throw Error(trim(proc.stderr));
};

spawnAsync = function(command, args, options) {
  var deferred, proc, stderr, stdout;
  deferred = Promise.defer();
  stdout = [];
  stderr = [];
  proc = childProcess.spawn(command, args, options);
  proc.on("error", function(error) {
    return deferred.reject(error);
  });
  proc.stdout.on("data", function(data) {
    return stdout.push(data);
  });
  proc.stderr.on("data", function(data) {
    return stderr.push(data);
  });
  proc.on("close", function(code) {
    if (stderr.length) {
      return deferred.reject(Error(trim(stderr.join(""))));
    } else {
      return deferred.resolve(trim(stdout.join("")));
    }
  });
  return deferred.promise;
};

trim = function(string) {
  return string.replace(/[\r\n]+$/, "");
};
