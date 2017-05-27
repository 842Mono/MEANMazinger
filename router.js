var express = require('express');
var router = express.Router();
var controller = require('./controller');

router.get('/', function(req,res){console.log("mazinger sa7y!"); res.send("Mazinger Sa7y!!");});

router.post('/register', controller.register);

router.post('/login', controller.login);

router.post('/sendmessage', controller.sendMessage);

module.exports = router;
