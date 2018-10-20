const Web3 = require('web3');
const publicContract = '../etc/public_contract_config.json'
const privateContract = '../etc/contract_config.json'

class Contract {
    constructor(configFile) {
        let config = require(configFile);
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.contractWS));
        this.contract = new this.web3.eth.Contract(config.abi, config.contractAddress);
        this.owner = config.owner;
        this.ownerPassword = config.ownerPassword;
        this.ownerSendOptions = {
            from: this.owner,
            gas: config.gas,
            gasPrice: config.gasPrice
        };
    }

    newAccount(password) {
        return this.web3.eth.personal.newAccount(password)
    }

    balanceOf(user) {
        return this.contract.methods.balanceOf(user).call();
    }

    sendSignedTransaction(signedTx) {
        return this.web3.eth.sendSignedTransaction(signedTx).then(receipt => {
            if (receipt.status == '0x0') {
                Promise.reject(new Error("private pay transaction revert"))
            } else {
                Promise.resolve()
            }
        })
    }

    getUserNonce(user) {
        return this.web3.eth.getTransactionCount(user)
    }

    getEther(user) {
        return this.web3.eth.getBalance(user)
    }

    sendEther(user, amount) {
        return this.web3.eth.sendTransaction({
            from: this.owner,
            to: user,
            value: amount
        })
    }
}

class PublicContract extends Contract {

    constructor() {
        super(publicContract)
    }

    pay(vs, rs, ss, message) {
        return this.contract.methods.pay(vs, rs, ss, message).send(this.ownerSendOptions).then(receipt => {
            if (receipt.status == '0x0') {
                Promise.reject(new Error("public pay transaction revert"))
            } else {
                Promise.resolve()
            }
        })
    }

    exchangeEvent(fallback) {
        console.log("listening")
        this.contract.events.Exchange({
            fromBlock: 0
        }).on('data', fallback)
    }

}

class PrivateContract extends Contract{

    constructor() {
        super(privateContract)
    }

    reward(user, amount) {
        return this.contract.methods.reward(user, amount).send(this.ownerSendOptions).then(receipt => {
            if (receipt.status == '0x0') {
                Promise.reject(new Error("Reward transaction revert"))
            } else {
                Promise.resolve()
            }
        })
    }

    consume(user, amount) {
        return this.contract.methods.consume(user, amount).send(this.ownerSendOptions).then(receipt => {
            if (receipt.status == '0x0') {
                Promise.reject(new Error("consume transaction revert"))
            } else {
                Promise.resolve()
            }
        })
    }

    pay(user, amount, transactionHash) {
        return this.contract.methods.pay(user, amount, transactionHash).send(this.ownerSendOptions).then(receipt => {
            if (receipt.status == '0x0') {
                Promise.reject(new Error("private pay transaction revert"))
            } else {
                Promise.resolve()
            }
        })
    }

    message(messageHash) {
        return this.contract.methods.message(messageHash).call()
    }

    signature(messageHash, index) {
        return this.contract.methods.signature(messageHash, index).call()
    }

    getRequiredSignatures() {
        return this.contract.methods.requiredSignatures().call()
    }

    submitSignature(message, signature) {
        return this.contract.methods.submitSignature(message, signature).send(this.ownerSendOptions).then(receipt => {
            if (receipt.status == '0x0') {
                Promise.reject(new Error("SubmitSignature transaction revert"))
            } else {
                Promise.resolve()
            }
        })
    }

    syncEvent(fallback) {
        console.log("listening")
        this.contract.events.Exchange({
            fromBlock: 0
        }).on('data', fallback)
    }

    collectedSignaturesEvent(fallback) {
        console.log("listening")
        this.contract.events.CollectedSignatures({
            fromBlock: 0
        }).on('data', fallback)
    }

}

module.exports.pvc = PrivateContract
module.exports.pbc = PublicContract