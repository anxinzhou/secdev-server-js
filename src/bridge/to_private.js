const Contract = require('../contract.js')
const pbc = new Contract.pbc()
const pvc = new Contract.pvc()

pbc.exchangeEvent(exchangeEventHandler);

function exchangeEventHandler(event) {
	console.log("recieve an exchange event");
	//Get a request from public chain to exchange his tokens
	//Add his token in private chain
	pvc.pay(event.returnValues.user, event.returnValues.amount, event.transactionHash)
		.then(() => {
			console.log("done with an exchange event", event.transactionHash);
		}).catch(console.log)
}