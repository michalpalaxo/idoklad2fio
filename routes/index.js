var express = require('express');
var router = express.Router();
var HTMLParser = require('node-html-parser');
var jsonxml = require('jsontoxml');
var _ = require('lodash');
var moment = require('moment');


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});


/* POST file. */
router.post('/', function (req, res, next) {
    if (!req.files) {
        throw new Error('Supply valid HTML file');
    }

    var htmlText = req.files.filetoupload.data.toString('utf8');

    var root = HTMLParser.parse(htmlText);

    var rows = root.querySelector('html')
        .querySelector('body')
        .querySelector('table')
        .querySelectorAll('tr');


    var domesticRows = [];
    var euroRows = [];

    var accountFrom = rows[4].querySelectorAll('td')[3].text.split('/')[0];

    try {

        for (var i = 8; i < rows.length; i++) {

            var curRow = rows[i];
            var cols = curRow.querySelectorAll('td');


            if (cols[1] && cols[1].text) {
                if(!cols[6].text){
                    break;
                }

                var account = cols[1].text.split('/')[0].replace(/\s/g, '');
                var bank = cols[1].text.split('/')[1];
                var amount = cols[2].text.replace(/\s/g, '').replace(/,/g, '.');
                var currency = cols[3].text;
                var varSym = cols[5].text;
                var comment = cols[7].text;

                if (currency === 'Kč') {
                    currency = 'CZK';
                }

                if (account) {
                    var elems = account.split('-');

                    if ((elems.length === 2 && elems[0].length > 1 && elems[0].length < 7 && elems[1].length > 5 && elems[0].length < 11) ||
                        (elems.length === 1 && elems[0].length > 5 && elems[0].length < 11)) {
                        var row = {
                            name: "DomesticTransaction",
                            children: [
                                {
                                    accountFrom: accountFrom,
                                    currency: currency,
                                    amount: amount,
                                    accountTo: account.trim(),
                                    bankCode: bank,
                                    ks: "",
                                    vs: varSym,
                                    ss: "",
                                    date: moment().format("YYYY-MM-DD"),
                                    messageForRecipient: "",
                                    comment: comment,
                                    paymentType: "431001"
                                }
                            ]
                        };
                        domesticRows.push(row);
                    } else if (elems.length === 1 && elems[0].length > 10 && elems[0].length < 35) {
                        var row = {
                            name: "T2Transaction",
                            children: [
                                {
                                    accountFrom: accountFrom,
                                    currency: currency,
                                    amount: amount,
                                    accountTo: account.trim(),
                                    ks: "",
                                    vs: varSym,
                                    ss: "",
                                    bic: "",
                                    date: moment().format("YYYY-MM-DD"),
                                    comment: comment,
                                    benefName: comment.substr(0, 15),
                                    benefStreet: "",
                                    benefCity: "",
                                    remittanceInfo1: "",
                                    remittanceInfo2: "",
                                    remittanceInfo3: "",
                                    paymentType: "431008"
                                }
                            ]
                        };
                        euroRows.push(row);
                    } else {
                        console.log('Unknown format - skipping row ' + i);
                    }
                }
            }
        }

    } catch (err) {
        console.log(err);
    }

    _.forEach(euroRows, function (row) {
        domesticRows.push(row);
    });

    var xml = jsonxml({
        Orders: domesticRows
    });

    xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Import xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"http://www.fio.cz/schema/importIB.xsd\">" + xml + "</Import>";

    res.set({"Content-Disposition": "attachment; filename=\"fio.xml\""});
    res.send(xml);


});


module.exports = router;
