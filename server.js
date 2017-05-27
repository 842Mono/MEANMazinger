var express = require('express');
var router = require('./router');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');


var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/mazinger");

var mazinger = express();
mazinger.use(bodyParser.urlencoded({extended:false}));
mazinger.use(express.static(__dirname + "/staticDir"));
mazinger.use(router);

mazinger.use(passport.initialize());
mazinger.use(passport.session());

mazinger.listen(5000, function(){console.log("Mazinnnnngeeeeer zeeeeeeeeee5000eeeeeee!")});
