
# exec 1.0.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

```coffee
#
# Synchronous version
#
try stdout = exec.sync "npm root -g"
catch error
  console.log error.stack

#
# Asynchronous version
#
exec.async "git status --porcelain"

.then (stdout) ->
  console.log stdout

.fail (error) ->
  console.log error.stack
```

**TODO:** Write tests?!
