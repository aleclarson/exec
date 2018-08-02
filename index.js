const {spawn, spawnSync} = require('child_process');
const TypeError = require('type-error');
const path = require('path');
const fs = require('fs');

function execAsync(cmd, args, opts) {
  if (typeof cmd !== 'string') {
    throw TypeError(String, cmd);
  }
  if (!Array.isArray(args)) {
    opts = args, args = [];
  }
  opts || (opts = {});
  opts.sync = false;
  return exec(cmd, args, opts);
}

function execSync(cmd, args, opts) {
  if (typeof cmd !== 'string') {
    throw TypeError(String, cmd);
  }
  if (!Array.isArray(args)) {
    opts = args, args = [];
  }
  opts || (opts = {});
  opts.sync = true;
  return exec(cmd, args, opts);
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

function exec(cmd, args, opts) {
  if (opts.cwd && !isDir(opts.cwd)) {
    const error = Error('Directory does not exist: ' + opts.cwd);
    error.code = 'ENOTDIR';
    throw error;
  }

  args = cmd.split(' ').concat(args.filter(arg => arg != null));
  cmd  = args.shift();

  // Default to utf8 string.
  opts.encoding || (opts.encoding = 'utf8');

  if (opts.sync) {
    const proc = spawnSync(cmd, args, opts);
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
      const proc = spawn(cmd, args, opts);

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
        proc.stdout.on('data', data => listener(null, data));
        proc.stderr.on('data', listener);
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
