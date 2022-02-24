'use strict';

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var bitcore = require('bitcore-lib');
var _ = bitcore.deps._;
var PrivateKey = bitcore.PrivateKey;
var PublicKey = bitcore.PublicKey;
var HDPrivateKey = bitcore.HDPrivateKey;
var Point = bitcore.crypto.Point;

var is_browser = process.browser;

var PC = require('..');
var PaymentCode = PC.PaymentCode;
var NotificationIn = PC.NotificationIn;
var NotificationOut = PC.NotificationOut;
var Secret = PC.Secret;

var x = new bitcore.HDPrivateKey('xprv9s21ZrQH143K2mKd7JFg7TLZaD6kYvuUGCq2RRqBGUxD7r14Acyaizf42LiGpSJxGCd8AKh4KXowS348PuhUxpTx45yw5iUc8ktXrWXLRnR');
var tc1 = {
    xPrivKey: x,
    xPubKey: x.hdPublicKey,
    paymentCode: 'PM8TJgiBF3npDfpxaKqU9W8iDL3T9v8j1RMVqoLqNFQcFdJ6PqjmcosHEQsHMGwe3CcgSdPz46NvJkNpHWym7b3XPF2CMZvcMT5vCvTnh58zpw529bGn',
    notificationPublicKeys: ['03032f6a9fa2e495b056755dfda82b288e22a71851032c02450e6ebbbef1695191'],
    notificationAddresses: ['18VPtWU95XYkKu47nrARz6hpQEzZmBPJMu'],
};

x = new bitcore.HDPrivateKey('xprv9s21ZrQH143K2nvwJx7FDB1qugo9xZxaRqMzsV72RxWaLwsMpmg8GsYsVEiwQD7qSpyuXn8oCUBdFbKnDBBKogtbtzBR2ubz5nPg8ojowWv');
var tc2 = {
    xPrivKey: x,
    xPubKey: x.hdPublicKey,
    paymentCode: 'PM8TJe68G1AE62CVEchCC7HnXnAa4PfxWPtYPsfnZ5ishRvo2qe6H3DcrN94ZU8DZ2CwAFDzqucPzSy9XstwQkfKD1A3VnhUvqUKvk5V9PFar9Ww3dsD',
    notificationAddresses: ['14L2fpcYwQQMmJvVJeewyuvdGfi49HmCZY'],
};

var p = new PrivateKey('a0b2bd6acc4fecf7d2b77d637f6bd4450e9ca701d5761b29ed824daab9e76361');
var n = new NotificationOut(tc1.paymentCode, tc2.paymentCode, p);
n.secrets[0].s.toString().should.equal('111469559018469246850263566406445487050435344289391776306916960726180370386701');

// ALICE
var utxoPrivKey = new PrivateKey('a0b2bd6acc4fecf7d2b77d637f6bd4450e9ca701d5761b29ed824daab9e76361');
var n = new NotificationOut(tc1.paymentCode, tc2.paymentCode, utxoPrivKey);

var tx = new bitcore.Transaction()
    .from({
        "txid": "3e46af54b2a79e8a343145e91e4801ea8611a69cd29852ff95e4b547cfd90b7b",
        "vout": 0,
        "scriptPubKey": n.getScriptPubKey().toString(),
        "amount": 1
    })
    .addData(n.outputs[0])
    .to(tc2.notificationAddresses[0], 100000)
    .sign(utxoPrivKey);

// BOB
var nIn = NotificationIn.fromTransaction(tx.uncheckedSerialize());
var secret = Secret.fromNotification(nIn, tc2.xPrivKey);
// console.log(JSON.stringify(tx.toJSON().inputs[0].output));
// secret.s.toString('hex').should.equal(n.secrets[0].s.toString('hex'));
// secret.x.toString('hex').should.equal(n.secrets[0].x.toString('hex'));

var a, b;

a = tc1;
b = tc2;

var alice = new PaymentCode([a.xPubKey]);
console.log(tc1.paymentCode)
console.log(alice.toString())
var utxoPrivKey = new PrivateKey('a0b2bd6acc4fecf7d2b77d637f6bd4450e9ca701d5761b29ed824daab9e76361');
//var utxoPrivKey = new PrivateKey();
var fromAliceToBob = alice.buildNotificationTo(b.paymentCode, utxoPrivKey);
var txToBob = new bitcore.Transaction()
    .from({
        "txid": "3e46af54b2a79e8a343145e91e4801ea8611a69cd29852ff95e4b547cfd90b7b",
        "vout": 0,
        "scriptPubKey": fromAliceToBob.getScriptPubKey().toString(),
        "amount": 1
    })
    .addData(fromAliceToBob.outputs[0])
    .to(b.notificationAddresses[0], 100000);

var x = bitcore.HDPrivateKey(a.xPrivKey);
txToBob.sign(utxoPrivKey);
var txToBobHex = txToBob.uncheckedSerialize();

// BOB

var bob = new PaymentCode(b.paymentCode);
var n = NotificationIn.fromTransaction(txToBob);
var secret = Secret.fromNotification(n, b.xPrivKey);
var herPc = new PaymentCode(n.decrypt(secret));
console.log(herPc.toString())
// herPc.toString().should.equal(a.paymentCode);
// herPc.xPubKeys[0].toString().should.equal(a.xPubKey.toString());