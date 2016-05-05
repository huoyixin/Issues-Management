'use strict'
var Promise = require("bluebird");
var github = Promise.promisifyAll(require('octonode'));
var userIssuesmodel = require('../mongoDB/userissues.js');

var handlebars = require('handlebars');
var moment = require('moment');
var showdown  = require('showdown');
var converter = new showdown.Converter();
var fs = require('fs');
var url = require('url');

exports.getIssues = function(req, res) {

	var assignee = req.body.assignee;
  	var username = req.body.username;
	var token = req.body.token;
  	var product = req.body.product;
	var repo = req.body.repo;
	var milestone = req.body.milestone;
	var lable = req.body.lable;
  	var status = req.body.status;
	var outputsetting = req.body.outputsetting;
	var lable = req.body.lable;
	var pageCount = 0;

	if(req.body.product === 'ALL'){
		product = '';
	}else{
		product = req.body.product;
	}

	if(req.body.lable === 'ALL'){
		lable = '';
	}else{
		lable = lable.toString().split(',');
	}

	if(status === 'ALL'){
		status = 'all';
	}

	if(milestone === '-1'){
		milestone = "none";
	}else if(milestone === 'ALL'){
		milestone = '*'
	}else{
		milestone = parseInt(req.body.milestone.toString());
	}
	
	if(assignee === 'No Assignee'){
		assignee = 'none';
	}

	console.log('-----Issues Select-----');
	console.log(username + ' get Issues:');
	console.log('repo:'+repo);
	console.log('milestone:'+milestone);
	console.log('product:'+product);
	console.log('status:'+status);
	console.log('lable:'+lable);
	console.log('outputsetting:'+outputsetting);
	console.log('assignee:'+assignee);

	var queryJson;
	if(assignee === 'ALL'){
		queryJson = {
						page: 1,
						per_page: process.env.PER_PAGE,
						milestone: milestone,
						state: status,
						sort : process.env.ISSUES_SORT,
						direction : process.env.ISSUES_DIRECTION,
						labels: lable
					}
	}else{
		queryJson = {
						page: 1,
						per_page: process.env.PER_PAGE,
						state: status,
						milestone: milestone,
						assignee: assignee,
						sort : process.env.ISSUES_SORT,
						direction : process.env.ISSUES_DIRECTION,
						labels: lable
					}
	}
	
	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	var ghrepo = client.repo(repo);
	ghrepo.issues(queryJson, function(err, data, headers){

		if(headers.link){
			var number_of_pages = url.parse(headers.link.split(',')[1],true).query.page;
			pageCount = number_of_pages;
		}else{
			pageCount = 1;
		}
		console.log("Page:" + pageCount);

		var IssuesHtmlStr = "";
		var currentIndex = 1;
		fetIssues();

		function fetIssues(){
			console.log("Get the page:"+currentIndex);
			queryJson.page = currentIndex;
			if(currentIndex > pageCount){
				console.log('-----Issues Select Done-----');
				res.status(200).send(IssuesHtmlStr); 
	        	return;
	    	}  

			var issuesFromGit;
			ghrepo.issuesAsync(queryJson)
			.then(function(JsonObject){
				
				issuesFromGit = JsonObject;
				return userIssuesmodel.userissues.find({ username: username , repo: repo})
				.exec();

			},function(err){
				console.log("err:");
				console.log(err);
				res.status(400).send(err);
			}).then(function(data){
				
				for(let i=0;i<issuesFromGit.length;i++){

					if(issuesFromGit[i].body.toString().indexOf(product) > 0 || product == ''){
							issuesFromGit[i].show = "true"
					}
					
					issuesFromGit[i].created_at = moment(issuesFromGit[i].created_at).fromNow();
					for(let n=0;n<data.length;n++){
						if(issuesFromGit[i].number === data[n].toObject().issues_id){
							console.log(data[n].toObject().issues_id)
							let tagStr = '';
							let tagObj = data[n].toObject().tags;
							for(let c= 0; c < tagObj.length; c++){
								tagStr += '{"name":"'+ tagObj[c].tagname +'","colour":"'+ tagObj[c].tagcolour+'"},'
							}	
							issuesFromGit[i].tag = eval('(['+tagStr+'])');
							issuesFromGit[i].description = data[n].toObject().description;
						}
					}
				}
				
				var resultString = "";
				if(outputsetting !== 'Only Title'){
					var source = fs.readFileSync('../templates/issuesDefault.hbs')
					var template = handlebars.compile(source.toString());
					var result = template(issuesFromGit);
					IssuesHtmlStr += result;
					console.log("Sucess Get the page:"+currentIndex);
					currentIndex++;
					fetIssues();
				}else{
					var source = fs.readFileSync('../templates/issuesTitleOnly.hbs')
					var template = handlebars.compile(source.toString());
					var result = template(issuesFromGit);
					IssuesHtmlStr += result;
					console.log("Sucess Get the page:"+currentIndex);
					currentIndex++;
					fetIssues();
				};

			});
		}

	})
}



exports.getComment = function(req, res) {

	var token = req.body.token;
	var repo = req.body.repo;
	var number = req.body.number;
  	console.log("token:"+token);

	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	var ghissue = client.issue(repo, number);

	ghissue.commentsAsync()
		.then(function(data){
			for(let i=0;i<data.length;i++){
				data[i].created_at = moment(data[i].created_at).fromNow();
			    data[i].body = converter.makeHtml(data[i].body);
			}

			if(data.length != 0){
				var source = fs.readFileSync('../templates/comment.hbs')
				var template = handlebars.compile(source.toString());
				var result = template(data);
				res.status(200).send(result);
			}else{
				var resuleStr = '<div class="comment">'+
								    '<div class="meta">'+
								      '<img class ="comment-png" src="images/login.png">'+
								      '<div class="issue-meta">'+
								      	'<span class="person">Github :</span>'+
								      '</div>'+
								      '<p>This issue don\'t have a comment</p>'+
								    '</div>'+
								'</div>'
				res.status(200).send(resuleStr);
			}
		});
}

exports.getContent = function(req, res) {

	var token = req.body.token;
	var repo = req.body.repo;
	var number = req.body.number;

	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	var ghissue = client.issue(repo, number);

	ghissue.infoAsync()
		.then(function(data){
			var content = converter.makeHtml(data.body);
			res.status(200).send(content);
		},function(err){
			res.status(400).send('Error');
		});
}

exports.getIssuesByTag = function(req, res) {

	var usernameStr = req.body.username;
	var repoStr = req.body.repoStr;
	var usertagStr = req.body.usertagStr;

	var token = req.body.token;
  	console.log("token:"+token);

	var client = github.client(token,{
	  hostname: process.env.API_HOST
	});

	userIssuesmodel.userissues.find({ username: usernameStr , repo: repoStr , 'tags.tagname':{ $in:usertagStr}},function(err,issues){
		if(err != null){
  			res.status(400).send('Error');
  		}else{
			var issuesLength = issues.length;
			var issuesData = issues;
			var currentIssuesIndex = 0;
			var IssuesHtmlStr = "";
			getIssuesInfo();
			function getIssuesInfo(){
				if(currentIssuesIndex >= issuesLength){
					res.status(200).send(IssuesHtmlStr); 
		        	return;
			    }
			    var issueJson;
			    var ghissue = client.issue(repoStr, issues[currentIssuesIndex].toObject().issues_id);
			    ghissue.infoAsync()
	  				.then(function(res){
						issueJson = res;
						return userIssuesmodel.userissues.find({ username: usernameStr , repo: repoStr}).exec();
	  				})
	  				.then(function(data){
				
						issueJson.created_at = moment(issueJson.created_at).fromNow();
						for(let n=0;n<data.length;n++){
							if(issueJson.number === data[n].toObject().issues_id){
								let tagStr = '';
								let tagObj = data[n].toObject().tags;
								for(let c= 0; c < tagObj.length; c++){
									tagStr += '{"name":"'+ tagObj[c].tagname +'","colour":"'+ tagObj[c].tagcolour+'"},'
								}	
								issueJson.tag = eval('(['+tagStr+'])');
								issueJson.description = data[n].toObject().description;
							}
						}
						
						var source = fs.readFileSync('../templates/issuesFromTag.hbs')
						var template = handlebars.compile(source.toString());
						var result = template(issueJson);
						IssuesHtmlStr += result;
						currentIssuesIndex++;
						getIssuesInfo();
					});

			}
  		};
	})

}

exports.setDesription = function(req, res) {

		var usernameStr = req.body.username;
		var issues_id = parseInt(req.body.issuesId);
		var repoStr = req.body.repoStr;
		var usertagStr = req.body.usertagStr;
		var usertagJSON = eval('('+usertagStr+')');
		var descriptionStr = req.body.description;
		
	    console.log("username:"+ usernameStr);
	    console.log("issuesId:"+ issues_id);
	    console.log("repoStr:"+ repoStr);
	    console.log("usertagStr:"+ usertagStr);
	    console.log("description:"+ descriptionStr);

		userIssuesmodel.userissues.findOne({ username: usernameStr, repo: repoStr, issues_id: issues_id},function(err,issues){

				if(issues === null){

					var issuesJSON = {"username" : usernameStr,
									  "repo" : repoStr,
									  "description" : descriptionStr,
									  "issues_id" : issues_id, 
									  "tags": usertagJSON, 
									  };

					var userissuesJSON = new userIssuesmodel.userissues(issuesJSON);
					userissuesJSON.save(function(err, docs){
					    if(err != null){
					    	console.log(err);
				  			res.status(400).send('Error');
				  		}else{
				  			res.status(200).send(docs);
				  		};
					});

				}else{
					issues.description = descriptionStr;
					issues.tags = usertagJSON;
					issues.save(function(err){
						if(err !== null){
							res.status(400).send('Error');
						}else{
							res.status(200).send('update');
						}
						
					});
				}
		})

}