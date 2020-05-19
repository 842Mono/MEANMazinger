var express = require('express');
var router = express.Router();
var controller = require('./controller');
var passport = require('passport');

//router.get('/', function(req,res){console.log("mazinger sa7y!"); res.send("Mazinger Sa7y!!");});
/*router.get
(
  '/',
  function(req,res)
  {
    res.sendFile(__dirname + "/staticDir/index.htm");
  }
);*/

router.get('/test', function(req,res){res.send("backend works!")});

router.post('/register', controller.register);

//router.post('/login', controller.login);

router.post('/sendmessage', controller.authorise, controller.sendMessage);
//router.post('/sendmessage', controller.sendMessage);

router.post('/authenticate', controller.authenticate);

router.get('/getallusers', controller.authorise, controller.getAllUsers);

router.post('/fetchconversation', controller.authorise, controller.fetchConversation);



router.post('/creategroupchat', controller.authorise, controller.createGroupChat);

router.post('/adduserstochat', controller.authorise, controller.addUsersToChat);

router.post('/sendmesssagegroup', controller.authorise, controller.sendMessageGroup);

router.post('/fetchconversationgroup', controller.authorise, controller.fetchConversationGroup);

router.post('/addfriend', controller.authorise, controller.addfriend);

router.get('/getfriendsandconversations', controller.authorise, controller.getFriendsAndConversations);

//router.get('/');

/*router.post
(
  '/login',
  passport.authenticate('local', {successRedirect:'/sr', failureRedirect:'/fr'}),
  function(req,res){console.log("You're logged in!");res.redirect('/');}
);

router.get('/test',passport.authenticate('jwt', { session: false }), function(req,res){console.log("you're good");});
router.get('/sr',function(req,res){console.log("success redirect!!!!!!")});
router.get('/fr',function(req,res){console.log("failure redirect :c")});

passport.use
(
  new LocalStrategy
  (
    function(Username, password, done)
    {
      User.findOne
      (
        {Username:Username},
        function(err, user)
        {
          if(err)
            throw err;
          if(!user)
            return done(null, false, {message: 'Unknown User'});
          User.comparePassword
          (
            password,
            user.password,
            function(err, isMatch)
            {
              if(err)
                throw err;
              if(isMatch)
                return done(null, user);
              else
                return done(null, false, {message: 'Invalid password'});
            }
          );
        }
      );
    }
  )
);

passport.serializeUser(function(user, done){done(null, user.Username);});

passport.deserializeUser
(
  function(Username, done)
  {
    User.findOne
    (
      {Username:Username},
      function(err, user)
      {
        done(err, user);
      }
    );
  }
);*/

module.exports = router;
