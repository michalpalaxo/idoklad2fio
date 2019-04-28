var express = require('express');
var router = express.Router();
var HTMLParser = require('node-html-parser');
var jsonxml = require('jsontoxml');


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});


/* POST file. */
router.post('/', function (req, res, next) {
    var htmlText = req.files.filetoupload.data.toString('utf8');

    var root = HTMLParser.parse(htmlText);

    //console.log(root.firstChild.structure);

    var xml = jsonxml({
        node: 'text content',
        parent: [
            {name: 'taco', text: 'beef taco', children: {salsa: 'hot!'}},
            {
                name: 'taco', text: 'fish taco', attrs: {mood: 'sad'}, children: [
                    {name: 'salsa', text: 'mild'},
                    'hi',
                    {name: 'salsa', text: 'weak', attrs: {type: 2}}
                ]
            },
            {name: 'taco', attrs: 'mood="party!"'}
        ],
        parent2: {
            hi: 'is a nice thing to say',
            node: 'i am another not special child node',
            date: function () {
                return (new Date()) + '';
            }
        }
    }, {xmlHeader: true, prettyPrint: true});

    console.log(xml);


    res.set({"Content-Disposition":"attachment; filename=\"fio.xml\""});
    res.send(xml);
});


module.exports = router;
