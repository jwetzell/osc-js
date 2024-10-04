const osc = require('../dist/index.js')

const buffer = osc.messageToBuffer({address:'/hello1',args:[{type: 's', value: 'arg1'}]})

console.log(buffer)
const message = osc.messageFromBuffer(buffer)

console.log(message)