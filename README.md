
# exec 1.0.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

```coffee
exec.async "git status --porcelain"

.then (stdout) ->
  console.log stdout

.fail (error) ->
  console.log error.stack
```

**TODO:** Write tests?!
