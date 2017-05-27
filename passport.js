const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('./Models/User');

const config = require('./secret');

// Setup work and export for the JWT passport strategy
module.exports = function(passport)
{
  const opts =
  {
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    secretOrKey: config.secret
  };

  passport.use
  (
    new JwtStrategy
    (
      opts,
      function(jwt_payload, done)
      {
        console.log(jwt_payload);
        const jwtUsername = jwt_payload.un;
        User.findOne
        (
          {Username:jwtUsername},
          function(err, user)
          {
            if(err)
              return done(err, false);
            if(user)
              done(null, user);
            else
              done(null, false);
          }
        );
      }
    )
  );
};
