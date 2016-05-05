'use strict'
var Promise = require("bluebird");
var github = Promise.promisifyAll(require('octonode'));
var usertagsmodel = require('../mongoDB/usertags.js');

exports.getRepoInfo = function(req, res) {

	var token = req.body.token;
	var username = req.body.username;
	var repo = req.body.repo;
	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	var ghrepo = client.repo(repo);

	var milestonesStr = '';
	var labelsStr = '';
	var tagStr = '';
	var infoStr = '';
	var assigneeStr = '';

	ghrepo.milestonesAsync({page: 0,per_page: 100,state:'all'})
		.then(function(data){
			milestonesStr = '{"number":'+ -1 +',"state":"No Assign","title":"No Milestones","count":" "},'
			for(let i=0;i<data.length;i++){
				milestonesStr += '{"number":'+data[i].number+',"state":"'+data[i].state+
					'","title":"'+data[i].title+'","count":"'+data[i].open_issues+'/'+data[i].closed_issues+'"},'
			}
			return ghrepo.labelsAsync();
		}).then(function(data){

			for(let i=0;i<data.length;i++){
				labelsStr += '{"name":"'+data[i].name+'","color":"#'+data[i].color+'"},'
			}

			return usertagsmodel.usertags.find({ username: username }).exec();
		}).then(function(data){

			for(let i=0;i<data.length;i++){
				tagStr += '{"tagName":"'+data[i].toObject().tagname+'","color":"'+data[i].toObject().tagcolour+'"},'
			}

			return ghrepo.contributorsAsync();
		}).then(function(data){
			assigneeStr = '{"name":"No Assignee","avatar_url":"/images/login.png"},'
			for(let i=0;i<data.length;i++){
				assigneeStr += '{"name":"'+data[i].login+'","avatar_url":"'+data[i].avatar_url+'"},'
			}

			return ghrepo.infoAsync();
		}).then(function(data){

			infoStr = '{"issuesCount":"'+data.open_issues+'","name":"'+data.full_name+
				'","description":"'+data.description+'","url":"'+data.html_url+'"}'

			var resultJsonStr = '{"info":'+infoStr+',"milestones":['+milestonesStr+'],"labels":['+labelsStr+'],"assignee":['+assigneeStr+'],"tag":['+tagStr+']}'

			res.status(200).send(resultJsonStr);
			res.end();	
		});

}