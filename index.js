const {spawn, spawnSync} = require('child_process');
const TypeError = require('type-error');
const fs = require('fs');

function execAsync(cmd, args, opts) {
  return exec(false, cmd, args, opts);
}

function execSync(cmd, args, opts) {
  return exec(true, cmd, args, opts);
}

module.exports = execAsync;
module.exports.sync = execSync;
module.exports.async = execAsync;

//
// Helpers
//

const trailingNewlines = /[\r\n]+$/

function stripTrailingNewlines(str) {
  return str.replace(trailingNewlines, '');
}

function isDir(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch(e) { return false; }
}

function exec(sync, cmd, ...args) {
  if (typeof cmd !== 'string') {
    throw TypeError(String, cmd);
  }

  // TODO: support escaped spaces?
  cmd = cmd.split(' ');

  const opts = {};
  args.forEach(arg => {
    if (arg == null) return;
    if (Array.isArray(arg)) {
      arg.forEach(arg => arg == null || cmd.push(arg));
    } else if (!sync && typeof arg == 'function') {
      opts.listener = arg;
    } else if (arg.constructor == Object) {
      Object.assign(opts, arg);
    } else {
      throw TypeError('an array, function, or object', arg);
    }
  });

  if (opts.cwd && !isDir(opts.cwd)) {
    const error = Error('Directory does not exist: ' + opts.cwd);
    error.code = 'ENOTDIR';
    throw error;
  }

  // Default to utf8 string.
  opts.encoding || (opts.encoding = 'utf8');

  if (sync) {
    const proc = spawnSync(cmd.shift(), cmd, opts);
    if (proc.error) {
      if (proc.error.code == 'ENOENT') {
        proc.error.message = 'Unknown command: ' + cmd;
      }
      throw proc.error;
    }
    if (proc.status == 0) {
      return stripTrailingNewlines(proc.stdout);
    }
    if (proc.stderr.length) {
      throw new Error(stripTrailingNewlines(proc.stderr));
    } else {
      throw new Error('Closed with non-zero exit code: ' + proc.status);
    }
  }
  else {
    // Capture a useful stack trace.
    const error = new Error();
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd.shift(), cmd, opts);

      let failed = false;
      proc.on('error', e => {
        Object.assign(error, e);
        error.message = e.code == 'ENOENT'
          ? 'Unknown command: ' + cmd
          : e.message;

        failed = true;
        reject(error);
      });

      if (opts.listener) {
        proc.stdout.on('data', data => opts.listener(null, data));
        proc.stderr.on('data', opts.listener);
        proc.on('close', code => {
          if (failed) return;
          if (code == 0) return resolve();
          error.message = 'Closed with non-zero exit code: ' + code;
          reject(error);
        });
      }
      else {
        var stdout = [], stderr = [];
        proc.stdout.on('data', data => stdout.push(data));
        proc.stderr.on('data', data => stderr.push(data));
        proc.on('close', code => {
          if (failed) return;
          if (code == 0) {
            resolve(stripTrailingNewlines(stdout.join('')));
          } else {
            error.message = stripTrailingNewlines(stderr.join(''));
            reject(error);
          }
        });
      }
    });
  }
}
