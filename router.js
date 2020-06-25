var express = require('express');
var router = express.Router();
var controller = require('./controller');


/**
 * Test route to check if the server is running.
 * 
 * @name get/test
 * 
 */
router.get('/test', function(req,res){res.send("backend works!")});

/**
 * Route for registration. User provides his data.
 * 
 * @name post/register
 * 
 * Required inputs:
 * @param {string} Username - The user's existing username. Required.
 * @param {string} Password - The user's existing password. Required.
 * @param {string} FirstName - The user's first name. Not required.
 * @param {string} MiddleName - The user's middle name. Not required.
 * @param {string} LastName - The user's last name. Not required.
 * @param {Date} DateOfBirth - The user's date of birth. Not required.
 * @param {string} Email - The user's email. Not required.
 * 
 * Returns JSON:
 * @param {boolean} success - Whether the user creation was successful
 * @param {string} msg - A message in case of failure.
 */
router.post('/register', controller.register);

/**
 * Route for login. User provides his username and password, and gets back a JWT.
 * 
 * @name post/authenticate
 * 
 * Required inputs:
 * Header @param {string} Authorization - The provided JWT.
 * @param {string} Username - The user's existing username.
 * @param {string} Password - The user's existing password.
 * 
 * Returns JSON:
 * @param {boolean} success - Whether the username and password matched a user.
 * @param {string} token - The JWT in case of success.
 * @param {string} msg - A message in case of failure.
 */
router.post('/authenticate', controller.authenticate);

/**
 * Route for a user to get a list of all other users in the system.
 * 
 * @name get/getallusers
 * 
 * Required inputs:
 * Header @param {string} Authorization - The provided JWT.
 * 
 * Returns JSON:
 * @param {boolean} success - Whether the request was successful.
 * @param {array} Users - An array of users.
 */
router.get('/getallusers', controller.authorise, controller.getAllUsers);

/**
 * Route to add a friend to a user's friend list.
 * 
 * @name post/addfriend
 * 
 * RequiredInputs:
 * Header @param {string} Authorization - The provided JWT.
 * @param {string} FriendUsername - The username of the friend to be added.
 * 
 * Returns JSON:
 * @param {boolean} success - Indicates whether the request was successful.
 * @param {string} msg - Indicates the result of the request.
 */
router.post('/addfriend', controller.authorise, controller.addfriend);

/**
 * Route to get the list of friends and the list of conversations of the user.
 * 
 * RequiredInputs:
 * Header @param {string} Authorization - The provided JWT.
 * 
 * Returns JSON:
 * @param {array} friends - The list of friend usernames.
 * @param {array} conversations - The list of conversation IDs of the user.
 */
router.get('/getfriendsandconversations', controller.authorise, controller.getFriendsAndConversations);

module.exports = router;
