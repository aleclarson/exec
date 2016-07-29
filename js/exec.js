var Path, Promise, assert, assertType, assertTypes, childProcess, exec, isType, optionTypes, syncFs, trim;

childProcess = require("child_process");

assertTypes = require("assertTypes");

assertType = require("assertType");

Promise = require("Promise");

syncFs = require("io/sync");

isType = require("isType");

assert = require("assert");

Path = require("path");

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
  var args, deferred, firstArgs, proc;
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
  assertType(options.cwd, String);
  if (!Path.isAbsolute(options.cwd)) {
    options.cwd = Path.resolve(process.cwd(), options.cwd);
  }
  assert(syncFs.isDir(options.cwd), "'options.cwd' must be a directory!");
  args = firstArgs;
  if (lastArgs && lastArgs.length) {
    args = args.concat(lastArgs);
  }
  if (args.length) {
    command += " " + args.join(" ");
  }
  if (options.sync) {
    proc = childProcess.spawnSync(command, options);
    if (proc.stderr.length === 0) {
      return trim(proc.stdout);
    }
    throw Error(trim(proc.stderr));
  }
  deferred = Promise.defer();
  proc = childProcess.exec(command, options, function(error, stdout, stderr) {
    if (error) {
      return deferred.reject(error);
    }
    if (stderr.length === 0) {
      return deferred.resolve(trim(stdout));
    }
    return deferred.reject(Error(trim(stderr)));
  });
  return deferred.promise;
};

trim = function(string) {
  return string.replace(/[\r\n]+$/, "");
};

//# sourceMappingURL=map/exec.map
