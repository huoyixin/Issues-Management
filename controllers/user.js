'use strict'
var Promise = require("bluebird");
var github = Promise.promisifyAll(require('octonode'));


exports.Login = function(req, res, next) {


	
    res.render('Login', { AOuth_HOST:process.env.AOUTH_HOST, 
    					  CLIENT_ID:process.env.CLIENT_ID });
}


exports.getUserInfo = function(req, res) {

	var token = req.body.token;
	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	var ghme = client.me();
	ghme.info(function(err, data) {
  		if(err != null){
  			res.status(400).send('Error');
  		}else{
  			var infoJson = {avatar_url:data.avatar_url,
			  				loginName:data.login,
			  				html_url:data.html_url}
  			res.status(200).send(infoJson);
  		};

	});

}

exports.getUserStatus = function(req, res) {
	var token = req.body.token;
  	console.log("token:"+token);

	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	var ghuser = client.me();
	ghuser.starred(function(err, data){

  		if(err != null){
  			res.status(400).send('Error');
  		}else{
  			var repoString = '';
			for(var n=0;n<data.length;n++){
				repoString += '{ label: "'+data[n].full_name+'", value: "'+data[n].full_name+'"},';
			}

			repoString = '['+repoString+']'
  			res.status(200).send(repoString);
  		};

	});
}