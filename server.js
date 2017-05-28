var express = require('express');
var router = require('./router');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

var mazinger = express();
mazinger.use(bodyParser.urlencoded({extended:false}));

mazinger.use(morgan('dev'));
mazinger.use(router);
mazinger.use(passport.initialize());
mazinger.use(passport.session());

mazinger.use(express.static(__dirname + "/staticDir/"));
mazinger.use('/api', router);
mazinger.get('*', (req, res) => {
  res.sendFile(__dirname + "/staticDir/frontend/src/");
});


var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/mazinger");
require('./passport')(passport);

mazinger.listen(5001, function(){console.log("Mazinnnnngeeeeer zeeeeeeeeee5001eeeeeee!")});
