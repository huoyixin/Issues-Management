'use strict'
var env = require('env2')('../config.env');
var express = require('express');
var router = express.Router();

var Promise = require("bluebird");
var github = Promise.promisifyAll(require('octonode'));

var Issues = require('../controllers/issues.js');
var User = require('../controllers/user.js');
var Repo = require('../controllers/repo.js');
var Tag = require('../controllers/tag.js');

router.get('/', function(req, res, next) {
	var code = req.query.code;
	if(!code){
		return res.redirect('/login');
	}

	github.auth.config({
	  id: process.env.CLIENT_ID,
	  secret: process.env.CLIENT_SECRET,
	  apiUrl: 'https://localhost:' + process.env.PORT,
	  webUrl: 'https://' + process.env.AOUTH_HOST
	}).login(['user', 'repo']);

	github.auth.login(code, function (err, token) {
		if(err){
			console.log("err:"+err);
			return res.redirect('/login');
		}
		res.cookie('token', token);
		res.render('index');
	});

});

router.get('/Login', User.Login);
router.post('/getuserstatus', User.getUserStatus);
router.post('/getuserinfo', User.getUserInfo);

router.post('/getissues', Issues.getIssues);
router.post('/getcomment', Issues.getComment);
router.post('/getContent', Issues.getContent);
router.post('/setdescription', Issues.setDesription);
router.post('/getissuesByTag', Issues.getIssuesByTag);

router.post('/getusertag', Tag.getUserTag);
router.post('/removeusertag', Tag.removeUserTag);
router.post('/setusertag', Tag.setUserTag);
router.post('/getmytag', Tag.getMytag);
router.post('/gettagwithinfo', Tag.getTagWithInfo);

router.post('/getrepoinfo', Repo.getRepoInfo);

module.exports = router;
