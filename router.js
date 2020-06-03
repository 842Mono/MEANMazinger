var express = require('express');
var router = express.Router();
var controller = require('./controller');


router.get('/test', function(req,res){res.send("backend works!")});

/**
 * Route for registration. User provides his data.
 * 
 * @name post/authenticate
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

router.post('/sendmessage', controller.authorise, controller.sendMessage);

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

router.post('/fetchconversation', controller.authorise, controller.fetchConversation);


router.post('/creategroupchat', controller.authorise, controller.createGroupChat);

router.post('/adduserstochat', controller.authorise, controller.addUsersToChat);

router.post('/sendmesssagegroup', controller.authorise, controller.sendMessageGroup);

router.post('/fetchconversationgroup', controller.authorise, controller.fetchConversationGroup);

router.post('/addfriend', controller.authorise, controller.addfriend);

router.get('/getfriendsandconversations', controller.authorise, controller.getFriendsAndConversations);

module.exports = router;
