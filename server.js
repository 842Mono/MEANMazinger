var express = require('express');
var router = require('./router');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/mazinger");

var mazinger = express();
mazinger.use(bodyParser.urlencoded({extended:false}));
mazinger.use(express.static(__dirname + "/staticDir"));
mazinger.use(router);
mazinger.listen(7000, function(){console.log("Mazinnnnngeeeeer zeeeeeeeeeeeeeeeeeeeee!")});
