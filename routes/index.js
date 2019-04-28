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
    if(!req.files){
        throw new Error('Supply valid HTML file');
    }

    var htmlText = req.files.filetoupload.data.toString('utf8');

    var root = HTMLParser.parse(htmlText);

    var rows = root.querySelector('html')
        .querySelector('body')
        .querySelector('table')
        .querySelectorAll('tr');


    var previousEmpty = false;
    var end = false;

    var exportRows = [];

    var accountFrom = rows[6].querySelectorAll('td')[3].text;

    _.forEach(rows, function (row, rowIndex) {
        if (rowIndex > 11) {
            var cols = row.querySelectorAll('td');
            if (cols[1].text && !end) {
                var account = cols[1].text.split('/')[0];
                var bank = cols[1].text.split('/')[1];
                var amount = cols[2].text.replace(/\s/g, '').replace(/,/g, '.');
                var varSym = cols[6].text;
                var comment = cols[8].text;

                var exportRow = {
                    name: "DomesticTransaction",
                    children: [
                        {
                            accountFrom: accountFrom,
                            currency: "CZK",
                            amount: amount,
                            accountTo: account,
                            bankCode: bank,
                            ks: "",
                            vs: varSym,
                            ss: "",
                            date: moment().format("DD.MM.YYYY"),
                            messageForRecipient: "",
                            comment: comment,
                            paymentType: "431001"
                        }
                    ]
                };

                exportRows.push(exportRow);
                previousEmpty = false;
            } else {
                if (previousEmpty) {
                    end = true;
                }
                previousEmpty = true;
            }
        }
    });


    var xml = jsonxml({
        Orders: exportRows
    });

    xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Import xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"http://www.fio.cz/schema/importIB.xsd\">" + xml + "</Import>";

    res.set({"Content-Disposition": "attachment; filename=\"fio.xml\""});
    res.send(xml);


});


module.exports = router;
