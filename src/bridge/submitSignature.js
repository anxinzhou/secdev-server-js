const Contract = require('../contract.js')
const pbc = new Contract.pbc()
const pvc = new Contract.pvc()

pvc.syncEvent(syncEventHandler)

function syncEventHandler(event) {
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

function prefixZero(num, length) {
	return (Array(length).join('0') + num).slice(-length);
}