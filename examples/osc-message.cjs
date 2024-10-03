const osc = require('../dist/index.js')

const buffer = osc.messageToBuffer({address:'/hello',args:[{type: 's', value: 'arg1'}]})

console.log(buffer)