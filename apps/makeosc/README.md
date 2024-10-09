![npm](https://img.shields.io/npm/v/makeosc)

# makeosc

Simple NodeJS script for generating OSC bytes output to stdout.

## Usage

```
Usage: makeosc [options]

simple util to make osc buffers

Options:
  -V, --version        output the version number
  --address <address>  OSC address
  --args <args...>     osc args (default: [])
  --slip               slip encode message (default: false)
  --types <types...>   osc arg types (choices: "s", "i", "f", "b", default: [])
  -h, --help           display help for command
```

- using npx `npx makeosc@latest --address /hello`
- install using `npm install -g makeosc@latest` and run `makeosc --address /hello`

## Notes

- `--types` option is a space seperate list of type characters that will determine what the corresponding argument type will be set to
  - optional
  - uses type codes from the OSC spec
- `--args` option is a space-separated list of arguments. If a corresponding type is not found in the `--types` option it will default to string (`s`).
  - blobs (`b`) are to be entered as hex string representing the buffer to be sent so the ASCII string `hello` would be `68656c6c6f`
- the default protocol is UDP but can be changed to TCP using the `--protocol` flag

## Examples

- `makeosc --address /test --args 1.0`
- `makeosc --address /this/is/sent/via/tcp`
- `makeosc --address /test/with/types --args 1 2.0 three --types i f`
  - note that `types` is not the same length as `args` so the remaining argument (`three`) will default to string
- `makeosc --address /blob --args 68656c6c6f --types b`
