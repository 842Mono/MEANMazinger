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

// mazinger.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin,X-Requested-With,content-type,Accept,Content-Type,application/json'
//   );
//   next();
// });


mazinger.use(cors());


var http = require('http');
var server = http.createServer(mazinger);


var io = require('socket.io').listen(server);
// var io = require('socket.io')(server, { origins: '*:*'});
// io.set('origins', '*:*');
// const io = require("socket.io")(server, {
//   handlePreflightRequest: (req, res) => {
//       const headers = {
//           "Access-Control-Allow-Headers": "Content-Type, Authorization",
//           "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
//           "Access-Control-Allow-Credentials": true
//       };
//       res.writeHead(200, headers);
//       res.end();
//   }
// });
server.listen(5100);
//var User = require('./Models/User');
//var Messages = require('./Models/Messages');


var OpenVidu = require('openvidu-node-client').OpenVidu;
var OpenViduRole = require('openvidu-node-client').OpenViduRole;
var fs = require('fs');
var https = require('https');

// Server configuration
mazinger.use(session({
  saveUninitialized: true,
  resave: false,
  secret: 'MY_SECRET'
}));
mazinger.use(express.static(__dirname + '/public_temp_openvidu')); // Set the static files location
mazinger.use(bodyParser.urlencoded({
  'extended': 'true'
})); // Parse application/x-www-form-urlencoded
mazinger.use(bodyParser.json()); // Parse application/json
mazinger.use(bodyParser.json({
  type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = {
  key: fs.readFileSync('openvidukey.pem'),
  cert: fs.readFileSync('openviducert.pem')
};
https.createServer(options, mazinger).listen(5000);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = "https://localhost:4443";
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = "MY_SECRET";

var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

// Collection to pair session names with OpenVidu Session objects
var mapSessions = {};
// Collection to pair session names with tokens
var mapSessionNamesTokens = {};


// Mock database
var users = [{
  user: "publisher1",
  pass: "pass",
  role: OpenViduRole.PUBLISHER
}, {
  user: "publisher2",
  pass: "pass",
  role: OpenViduRole.PUBLISHER
}, {
  user: "subscriber",
  pass: "pass",
  role: OpenViduRole.SUBSCRIBER
}];

/* REST API */

// Login
mazinger.post('/api-login/login', function (req, res) {

  // Retrieve params from POST body
  var user = req.body.user;
  var pass = req.body.pass;
  console.log("Logging in | {user, pass}={" + user + ", " + pass + "}");

  if (login(user, pass)) { // Correct user-pass
      // Validate session and return OK 
      // Value stored in req.session allows us to identify the user in future requests
      console.log("'" + user + "' has logged in");
      req.session.loggedUser = user;
      res.status(200).send();
  } else { // Wrong user-pass
      // Invalidate session and return error
      console.log("'" + user + "' invalid credentials");
      req.session.destroy();
      res.status(401).send('User/Pass incorrect');
  }
});

// Logout
mazinger.post('/api-login/logout', function (req, res) {
  console.log("'" + req.session.loggedUser + "' has logged out");
  req.session.destroy();
  res.status(200).send();
});

// Get token (add new user to session)
mazinger.post('/api-sessions/get-token', function (req, res) {
  if (!isLogged(req.session)) {
      req.session.destroy();
      res.status(401).send('User not logged');
  } else {
      // The video-call to connect
      var sessionName = req.body.sessionName;

      // Role associated to this user
      var role = users.find(u => (u.user === req.session.loggedUser)).role;

      // Optional data to be passed to other users when this user connects to the video-call
      // In this case, a JSON with the value we stored in the req.session object on login
      var serverData = JSON.stringify({ serverData: req.session.loggedUser });

      console.log("Getting a token | {sessionName}={" + sessionName + "}");

      // Build tokenOptions object with the serverData and the role
      var tokenOptions = {
          data: serverData,
          role: role
      };

      if (mapSessions[sessionName]) {
          // Session already exists
          console.log('Existing session ' + sessionName);

          // Get the existing Session from the collection
          var mySession = mapSessions[sessionName];

          // Generate a new token asynchronously with the recently created tokenOptions
          mySession.generateToken(tokenOptions)
              .then(token => {

                  // Store the new token in the collection of tokens
                  mapSessionNamesTokens[sessionName].push(token);

                  // Return the token to the client
                  res.status(200).send({
                      0: token
                  });
              })
              .catch(error => {
                  console.error(error);
              });
      } else {
          // New session
          console.log('New session ' + sessionName);

          // Create a new OpenVidu Session asynchronously
          OV.createSession()
              .then(session => {
                  // Store the new Session in the collection of Sessions
                  mapSessions[sessionName] = session;
                  // Store a new empty array in the collection of tokens
                  mapSessionNamesTokens[sessionName] = [];

                  // Generate a new token asynchronously with the recently created tokenOptions
                  session.generateToken(tokenOptions)
                      .then(token => {

                          // Store the new token in the collection of tokens
                          mapSessionNamesTokens[sessionName].push(token);

                          // Return the Token to the client
                          res.status(200).send({
                              0: token
                          });
                      })
                      .catch(error => {
                          console.error(error);
                      });
              })
              .catch(error => {
                  console.log("error here!");
                  console.error(error);
                  console.log(error);
                  console.log(JSON.stringify(error.message));
              });
      }
  }
});

// Remove user from session
mazinger.post('/api-sessions/remove-user', function (req, res) {
  if (!isLogged(req.session)) {
      req.session.destroy();
      res.status(401).send('User not logged');
  } else {
      // Retrieve params from POST body
      var sessionName = req.body.sessionName;
      var token = req.body.token;
      console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + token + '}');

      // If the session exists
      if (mapSessions[sessionName] && mapSessionNamesTokens[sessionName]) {
          var tokens = mapSessionNamesTokens[sessionName];
          var index = tokens.indexOf(token);

          // If the token exists
          if (index !== -1) {
              // Token removed
              tokens.splice(index, 1);
              console.log(sessionName + ': ' + tokens.toString());
          } else {
              var msg = 'Problems in the app server: the TOKEN wasn\'t valid';
              console.log(msg);
              res.status(500).send(msg);
          }
          if (tokens.length == 0) {
              // Last user left: session must be removed
              console.log(sessionName + ' empty!');
              delete mapSessions[sessionName];
          }
          res.status(200).send();
      } else {
          var msg = 'Problems in the app server: the SESSION does not exist';
          console.log(msg);
          res.status(500).send(msg);
      }
  }
});

/* REST API */



/* AUXILIARY METHODS */

function login(user, pass) {
  return (users.find(u => (u.user === user) && (u.pass === pass)));
}

function isLogged(session) {
  return (session.loggedUser != null);
}

function getBasicAuth() {
  return 'Basic ' + (new Buffer('OPENVIDUAPP:' + OPENVIDU_SECRET).toString('base64'));
}

/* AUXILIARY METHODS */










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


    socket.on
    (
      'changeNewMessageGroup',
      function(data)
      {
        let recepients = JSON.parse(recepients);

        recepients.forEach(recepient =>
        {
          let user = connections.filter
          (
            function(connectionElement)
            {
              return connectionElement.un == recepient;
            }
          );
          if(user.length > 0)
          {
            user[0].s.emit('changeConversation',{sender:data.sender});
            console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
          }
        });
      }
    );
    socket.on
    (
      'changeNewMessageGroupID',
      function(data)
      {
        controller.getRecepientsFromID(data.ConversationID, function(recepients)
        {

          recepients.forEach(recepient =>
          {
            let user = connections.filter
            (
              function(connectionElement)
              {
                return connectionElement.un == recepient;
              }
            );
            if(user.length > 0 && user[0] !== data.sender)
            {
              console.log(data.sender);
              console.log("^^");
              user[0].s.emit('changeConversation',{sender:data.sender});
              console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
            }
          });

        });
      }
    );
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


mazinger.listen(5001, function(){console.log("Mazinnnnngeeeeer zeeeeeeeeee5001eeeeeee!")});
