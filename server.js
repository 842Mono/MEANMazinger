var express = require('express');
var router = require('./router');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var cors = require('cors');

var controller = require('./controller');


var expressApp = express();



expressApp.use(cors());


var http = require('http');
var server = http.createServer(expressApp);


var io = require('socket.io').listen(server);

server.listen(5100);

var OpenVidu = require('openvidu-node-client').OpenVidu;
var fs = require('fs');
var https = require('https');

// Server configuration
expressApp.use(session({
  saveUninitialized: true,
  resave: false,
  secret: 'MY_SECRET'
}));
expressApp.use(express.static(__dirname + '/public_temp_openvidu')); // Set the static files location

expressApp.use(bodyParser.json({
  type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = {
  key: fs.readFileSync('openvidukey.pem'),
  cert: fs.readFileSync('openviducert.pem')
};
https.createServer(options, expressApp).listen(5000);

// For demo purposes we ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = "https://localhost:4443";
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = "MY_SECRET";
var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);


let _socketRouter = require('./socketRouter')(io, OV);

expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({extended:false}));

//expressApp.use(morgan('dev'));
expressApp.use(passport.initialize());
expressApp.use(passport.session());

expressApp.use(express.static(__dirname + "/staticDir/frontend/dist"));

expressApp.use('/api', router);
expressApp.get('*', (req, res) => {res.sendFile(__dirname + "/staticDir/frontend/dist/index.html");});




var mongoose = require('mongoose');
// mongoose.set("debug", true);
mongoose.connect("mongodb://localhost:27017/mazinger");
var thedb = mongoose.connection;
thedb.on('error', console.error.bind(console, 'Check The mongodb daemon!'));
thedb.once
(
  'open',
  function()
  {
    controller.initClearOnline();
  }
);

require('./passport')(passport);


expressApp.listen(5001, function(){console.log("Mazinnnnngeeeeer zeeeeeeeeee5001eeeeeee!")});
