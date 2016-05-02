
# exec 1.0.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

Uses [aleclarson/q](https://github.com/aleclarson/q) for `Promise` support.

```coffee
exec "git status --porcelain"

.then (stdout) ->
  console.log stdout

.fail (error) ->
  console.log error.stack
```

**TODO:** Write tests?!
