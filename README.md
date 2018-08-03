# exec v1.2.1

Easy shell execution

```js
const exec = require('exec');

// Sync version
try {
  const stdout = exec.sync('npm root -g');
  console.log(stdout);
} catch(stderr) {
  console.error(stderr);
}

// Async version
exec('git status --porcelain')
  .then(stdout => {
    console.log(stdout);
  }, stderr => {
    console.error(stderr);
  });

// Child process options
const files = await exec('ls -a', {
  cwd: 'path/to/dir'
});

// Additional arguments
const status = await exec('git status', [
  porcelain ? '--porcelain' : null, // null and undefined values are filtered out
]);
```

Available options are described [here](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).
