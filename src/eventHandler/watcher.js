const Contract = require('../contract.js')
const pbc = new Contract.pbc()
const pvc = new Contract.pvc()

pvc.syncEvent(syncEventHandler)
pbc.exchangeEvent(exchangeEventHandler)
pvc.collectedSignaturesEvent(collectedSignaturesHandler)

class EventHandler {
    constructor() {

    }

    syncEventHandler(event) {
        console.log("recieve an exchange event");

        //Get parameters from event
        var recipient = event.returnValues.user
        var value = event.returnValues.amount
        var transactionHash = event.transactionHash

        // Compose message , corresponding to format of message in contract
        // 0x + <trasactionHash> + <recipient> + <exchange amount>
        var message = [transactionHash]
        message.push(recipient.slice(2))
        message.push(prefixZero(pvc.web3.utils.toHex(value).slice(2), 64))
        message = message.join('')

        //Sign and sumbit signature to contract in private chain.
        var signature;
        pvc.web3.eth.sign(message, pvc.owner)
            .then(signature => {
                return pvc.submitSignature(message, signature)
            })
            .then(() => {
                console.log("done with an exchange event")
            })
            .catch(console.log)
    }

    exchangeEventHandler(event) {
        console.log("recieve an exchange event");
        //Get a request from public chain to exchange his tokens
        //Add his token in private chain
        pvc.pay(event.returnValues.user, event.returnValues.amount, event.transactionHash)
            .then(() => {
                console.log("done with an exchange event", event.transactionHash);
            }).catch(console.log)
    }

    collectedSignaturesHandler(event) {
        console.log("recieve a signatures collected event");

        //only the last signer sumbit a transaction to add tokens of the user
        if (pvc.owner.toLowerCase() != event.returnValues.authorityMachineResponsibleForRelay.toLowerCase()) {
            console.log("This duty should be done by ", event.returnValues.authorityMachineResponsibleForRelay)
            return
        }

        var message;
        var signatures = [];
        var promises = [];
        // vs, rs, ss is used to recover the signature of a user.
        // see ecrecover in solidity
        var vs = []
        var rs = []
        var ss = []

        pvc.message(event.returnValues.messageHash)
            .then(msg => {
                message = msg
                return pvc.getRequiredSignatures()
            })
            .then(rqSigs => {
                for (let i = 0; i < rqSigs; ++i) {
                    promises.push(pvc.signature(event.returnValues.messageHash, i).then(sig => {
                        signatures.push(sig);
                    }))
                }
                return Promise.all(promises)
            })
            .then(() => {
                for (let i = 0; i < signatures.length; ++i) {
                    var sig = signatures[i].slice(2);
                    var r = `0x${sig.slice(0, 64)}`
                    var s = `0x${sig.slice(64, 128)}`
                    var v = pbc.web3.utils.toDecimal(sig.slice(128, 130))
                    //console.log(sig);
                    //console.log(r, s, v, message);
                    vs.push(v)
                    rs.push(r)
                    ss.push(s)
                }
                return pbc.pay(vs, rs, ss, message)
            })
            .then(() => {
                console.log("done with an signatures collected event")
            })
            .catch(console.log)
    }

    prefixZero(num, length) {
        return (Array(length).join('0') + num).slice(-length);
    }
}