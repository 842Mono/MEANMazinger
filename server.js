var express = require('express');
var router = require('./router');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var cors = require('cors');

var controller = require('./controller');


var mazinger = express();

var http = require('http');
var server = http.createServer(mazinger);


var io = require('socket.io').listen(server);

server.listen(5100);

//var User = require('./Models/User');
//var Messages = require('./Models/Messages');

var connections = [];
var countTotalSockets = 0;

io.sockets.on
(
  'connection',
  function(socket)
  {
    ++countTotalSockets;
    console.log("\n\nServerEvent: Connect!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");

    socket.on
    (
      'disconnect',
      function(data)
      {
        --countTotalSockets;

        let connection = connections.filter
        (
          function(connectionElement)
          {
            return connectionElement.s == socket;
          }
        );
        if(connection.length > 0)
        {
          connections = connections.filter
          (
            function(connectionElement)
            {
              return connectionElement.s != socket;
            }
          );
          //console.log(connection[0].un);
          console.log("Emitting changeGetAllUsers!");
          controller.socketUpdateOnline(connection[0].un, false, function(){io.sockets.emit('changeGetAllUsers', {});});
        }
        //else
        //  io.sockets.emit('changeGetAllUsers', {});

        console.log("\n\nServerEvent: Disconnect!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
      }
    );

    socket.on
    (
      'authenticated',
      function(data)
      {
        connections.push({s:socket,un:data.Username});
        controller.socketUpdateOnline(data.Username, true, function(){io.sockets.emit('changeGetAllUsers', {});});
        console.log("\n\nServerEvent: Authentication!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
      }
    );

    socket.on
    (
      'changeNewMessage',
      function(data)
      {
        let user = connections.filter
        (
          function(connectionElement)
          {
            return connectionElement.un == data.recepient;
          }
        );

        if(user.length > 0)
        {
          user[0].s.emit('changeConversation',{sender:data.sender});
          console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
        }
      }
    );

    //socket.to(<socketid>).emit('hey', 'I just met you');

  }
);

mazinger.use(bodyParser.json());
mazinger.use(bodyParser.urlencoded({extended:false}));

//mazinger.use(morgan('dev'));
mazinger.use(passport.initialize());
mazinger.use(passport.session());

mazinger.use(express.static(__dirname + "/staticDir/frontend/dist"));

//mazinger.all('/*', function(req, res, next) {res.header("Access-Control-Allow-Origin", "*"); res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); next();});

mazinger.use('/api', router);
mazinger.get('*', (req, res) => {res.sendFile(__dirname + "/staticDir/frontend/dist/index.html");});




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

mazinger.use(cors());

mazinger.listen(5001, function(){console.log("Mazinnnnngeeeeer zeeeeeeeeee5001eeeeeee!")});
