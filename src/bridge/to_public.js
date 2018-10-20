const Contract = require('../contract.js')
const pbc = new Contract.pbc()
const pvc = new Contract.pvc()

pvc.collectedSignaturesEvent(collectedSignaturesHandler)

function collectedSignaturesHandler(event) {
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
				var r = `0x${sig.slice(0,64)}`
				var s = `0x${sig.slice(64,128)}`
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