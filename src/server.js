const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = new Router();
const Contract = require('./contract/contract.js')
const pvc = new Contract.pvc();
const pbc = new Contract.pbc();
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');


router.prefix('/api/v1');
router.get('/tokens/:user', getToken) //{}
    .get('/nonce/:user', getUserNonce)
    .get('/ether/:user', getUserEther)
    .put('/tokens/:user', updateToken) // body { signedTx : xxx }
    .get('/publicTokens/:user', getPubToken) // {}
    .put('/publicTokens/:user', updatePubToken) //body { signedTx : xxx }

    .get('/publicNonce/:user', getPubUserNonce)
    .get('/publicEther/:user', getPubUserEther)
    .post('/faucet', requireEther)

console.log("app start");
app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.listen(3000, '0.0.0.0');

async function getUserNonce(ctx) {
    ctx.response.type = "json"
    var user = ctx.params.user
    try {
        await pvc.getUserNonce(user).then(nonce => {
            ctx.response.status = 200;
            ctx.response.body = {
                nonce: nonce
            }
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}


async function getPubUserNonce(ctx) {
    ctx.response.type = "json"
    var user = ctx.params.user
    try {
        await pbc.getUserNonce(user).then(nonce => {
            ctx.response.status = 200;
            ctx.response.body = {
                nonce: nonce
            }
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function getToken(ctx) {
    ctx.response.type = "json"
    var user = ctx.params.user
    try {
        await pvc.balanceOf(user).then(amount => {
            ctx.response.status = 200;
            ctx.response.body = {
                amount: amount
            }
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function getPubToken(ctx) {
    ctx.response.type = "json";
    var user = ctx.params.user;
    try {
        await pbc.balanceOf(user).then(amount => {
            ctx.response.status = 200;
            ctx.response.body = {
                amount: amount
            }
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function updateToken(ctx) { // body { amount: xxx  sync: }
    ctx.response.type = "json";
    var user = ctx.params.user;
    var amount = ctx.request.body.amount;
    var sync = ctx.request.body.sync;
    var p;
    if (sync != undefined) {
        var signedTx = ctx.request.body.signedTx
        p = pvc.sendSignedTransaction(signedTx)
    } else {
        if (amount < 0) {
            p = pvc.consume(user, -amount);
        } else {
            p = pvc.reward(user, amount);
        }
    }

    try {
        await p.then(() => {
            ctx.response.status = 200;
        })
    } catch (err) {
        console.log(err)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function updatePubToken(ctx) { // body { signedTx : xxx }
    ctx.response.type = "json";
    var user = ctx.params.user;
    var signedTx = ctx.request.body.signedTx
    var p = pbc.sendSignedTransaction(signedTx);
    try {
        await p.then(() => {
            ctx.response.status = 200;
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function getUserEther(ctx) {
    ctx.response.type = "json"
    var user = ctx.params.user
    try {
        await pvc.getEther(user).then(ether => {
            ctx.response.status = 200;
            ctx.response.body = {
                ether: ether
            }
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function getPubUserEther(ctx) {
    ctx.response.type = "json"
    var user = ctx.params.user
    try {
        await pbc.getEther(user).then(ether => {
            ctx.response.status = 200;
            ctx.response.body = {
                ether: ether
            }
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        ctx.response.body = {
            message: err.message
        }
    }
}

async function requireEther(ctx) {
    ctx.response.type = "json";
    var account = ctx.request.body.account;
    var amount = '10000000000000000'; // 0.1 ether
    try {
        await pbc.sendEther(account, amount).then(() => {
            console.log("Send ether to ", account, " success!");
            ctx.response.status = 200;
        })
    } catch (err) {
        console.log(err.message)
        ctx.response.status = 400;
        console.log(err);
        ctx.response.body = {
            message: err.message
        }
    }
}