const solc = require('solc')
const fs = require('fs-extra')
var program = require('commander')
var Web3 = require('web3');
const {
    promisify
} = require('util')
const readFile = promisify(fs.readFile)

program
    .version('0.0.1')
    .option('-k, --chainKind <chainKind>', 'chain kind, public or private (default private)')
    .option('-f, --file <path>', 'contract to be compiled')
    .option('-c, --config <path>', 'config file to write (default ../etc/contract_config.json)')
    .option('-u, --address <user>', 'address to deploy the contract (default coinbase)')
    .option('-p, --password <password>', 'password for user (default 321)')
    .option('-r, --rpcport <rpc>', 'rpc for chain (default 8540)')
    .option('-w, --wsport <websocket>', 'websocket for chain (default 8450)')
    .option('-a, --arguments <arguments>', 'constructor arguments for contract')
    .option('-n, --contractName <contractName>', 'name of contract to deploy')
    .parse(process.argv)

var config = {
    gas: undefined,
    gasPrice: undefined,
    contractWS: undefined,
    contractUri: undefined,
    contractAddress: undefined,
    abi: undefined
}

var solFilePath
var configPath
var web3
var arg
var contractName

initialConfig()
    .then(() => {
        return setAccount();
    })
    .then(() => {
        return unLockAccount()
    })
    .then(() => {
        console.log("unlock account successfully")
        return readFile(solFilePath)
    })
    .then(input => {
        console.log("load contract successfully")
        return deployContract(input)
    })
    .then(instance => {
        console.log("deploy contract successfully")
        return setContractToConfig(instance)
    })
    .then(() => {
        console.log("set contract to config successfully")
        return writeConfig()
    })
    .then(() => {
        console.log(`wrote config to ${configPath} successfully`)
    })
    .catch(console.log);


function writeConfig() {
    return fs.writeJson(configPath, config)
}

function initialConfig() {
    return new Promise((resolve, reject) => {
        if (!program.file) {
            reject(new Error("no contract file specefied"))
        }
        if (!program.arguments) {
            reject(new Error("no arguments specefied"))
        }
        arg = JSON.parse(program.arguments)
        config.gas = 3000000
        config.gasPrice = "0"
        config.contractWS = "ws://localhost:8450"
        config.contractUri = "http://localhost:8540"

        if (program.chainKind == "public") {
            config.gasPrice = 33333333;
        }

        if (program.config) {
            configPath = program.config
        } else {
            configPath = '../../etc/contract_config.json'
        }

        if (program.contractName) {
            contractName = program.contractName
        } else {
            reject(new Error("please specify contract name to deploy"))
        }

        solFilePath = program.file

        if (program.rpcport) {
            config.contractUri = "http://localhost:" + program.rpcport
        }

        if (program.wsport) {
            config.contractWS = "ws://localhost:" + program.wsport
        }
        try {
            web3 = new Web3(new Web3.providers.HttpProvider(config.contractUri))
        } catch (err) {
            reject(err);
        }
        resolve();
    })
}

function setAccount() {
    if (!program.address && !program.password) {
        return web3.eth.getCoinbase().then(address => {
            config.owner = address
            config.ownerPassword = "321"
        })
    } else if (program.address && program.password) {
        config.owner = program.address
        config.ownerPassword = program.password
    } else {
        return new Promise((resolve, reject) => {
            reject(new Error("please provide address and password at the same time"))
        })
    }
    return new Promise((resolve, reject) => {
        resolve();
    })
}

function unLockAccount() {
    return web3.eth.personal.unlockAccount(config.owner, config.ownerPassword)
}

function deployContract(input) {
    var output = solc.compile(input.toString(), 1)
    var bytecode, abi, contract
    // var contractName = ':slot'
    if (!output.contracts.hasOwnProperty(contractName)) {
        throw new Error('no such contract')
    }
    bytecode = output.contracts[contractName].bytecode
    abi = JSON.parse(output.contracts[contractName].interface)
    contract = new web3.eth.Contract(abi)
    const ownerSendOptions = {
        from: config.owner,
        gas: config.gas,
        gasPrice: config.gasPrice
    };
    return contract.deploy({
        data: '0x' + bytecode,
        arguments: arg
    }).send(ownerSendOptions)
}

function setContractToConfig(instance) {
    return new Promise((resolve, reject) => {
        config.contractAddress = instance.options.address
        config.abi = instance.options.jsonInterface
        resolve()
    })
}