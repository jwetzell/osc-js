![npm](https://img.shields.io/npm/v/sendosc)

# sendosc

Simple NodeJS script for sending OSC via TCP or UDP originally inspired by this [c++ utility](https://github.com/yoggy/sendosc) of the same name.

## Usage

```
Usage: sendosc [options]

simple util to sendosc

Options:
  -V, --version          output the version number
  --protocol <protocol>  Network protocol (choices: "tcp", "udp", default: "udp")
  --host <host>          the host to send osc to
  --port <port>          the port to send osc to
  --address <address>    OSC address
  --args <args...>       osc args (default: [])
  --slip                 slip encode message (default: false)
  --types <types...>     osc arg types (choices: "s", "i", "f", "b", default: [])
  -h, --help             display help for command
```

- using npx `npx sendosc@latest --host 127.0.0.1 --port 9999 --address /hello`
- install using `npm install -g sendosc@latest` and run `sendosc --host 127.0.0.1 --port 9999 --address /hello`

## Notes

- `--types` option is a space seperate list of type characters that will determine what the corresponding argument type will be set to
  - optional
  - uses type codes from the OSC spec
- `--args` option is a space-separated list of arguments. If a corresponding type is not found in the `--types` option it will default to string (`s`).
  - blobs (`b`) are to be entered as hex string representing the buffer to be sent so the ASCII string `hello` would be `68656c6c6f`
- the default protocol is UDP but can be changed to TCP using the `--protocol` flag

## Examples

- `sendosc --host 127.0.0.1 --port 8000 --address /test --args 1.0`
- `sendosc --protocol tcp --host 127.0.0.1 --port 8000 --address /this/is/sent/via/tcp`
- `sendosc --host 127.0.0.1 --port 8000 --address /test/with/types --args 1 2.0 three --types i f`
  - note that `types` is not the same length as `args` so the remaining argument (`three`) will default to string
- `sendosc --host 127.0.0.1 --port 8000 --address /blob --args 68656c6c6f --types b`
