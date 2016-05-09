var Path, Q, assert, assertType, isType, ref, spawnSync, syncFs;

ref = require("type-utils"), isType = ref.isType, assert = ref.assert, assertType = ref.assertType;

spawnSync = require("child_process").spawnSync;

syncFs = require("io/sync");

Path = require("path");

Q = require("q");

module.exports = function(command, args, options) {
  var argsFromCommand;
  if (isType(args, Object)) {
    options = args;
    args = null;
  } else {
    if (options == null) {
      options = {};
    }
  }
  argsFromCommand = command.split(" ");
  command = argsFromCommand.shift();
  if (argsFromCommand.length) {
    args = argsFromCommand.concat(args || []);
  } else {
    if (args == null) {
      args = [];
    }
  }
  assertType(command, String);
  assertType(args, Array);
  assertType(options, Object);
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
  return Q["try"](function() {
    var proc;
    proc = spawnSync(command, args, options);
    if (proc.stderr.length > 0) {
      throw Error(proc.stderr.replace(/[\r\n]+$/, ""));
    }
    return proc.stdout.replace(/[\r\n]+$/, "");
  });
};

//# sourceMappingURL=../../map/src/index.map
