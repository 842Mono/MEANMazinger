var express = require('express');
var router = express.Router();
var controller = require('./controller');
var passport = require('passport');

router.get('/', function(req,res){console.log("mazinger sa7y!"); res.send("Mazinger Sa7y!!");});

router.post('/register', controller.register);

//router.post('/login', controller.login);

router.post('/sendmessage', controller.authorise, controller.sendMessage);

router.post('/authenticate', controller.authenticate);

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
