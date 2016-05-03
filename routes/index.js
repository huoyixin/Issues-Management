'use strict'
var env = require('env2')('../config.env');
var Promise = require("bluebird");
var express = require('express');
var router = express.Router();
var github = Promise.promisifyAll(require('octonode'));
var handlebars = require('handlebars');
var moment = require('moment');
var showdown  = require('showdown');
var converter = new showdown.Converter();
var fs = require('fs');
var usertagsmodel = require('../mongoDB/usertags.js');
var userIssuesmodel = require('../mongoDB/userissues.js');
var url = require('url');

var auth_url = github.auth.config({
  id: process.env.CLIENT_ID,
  secret: process.env.CLIENT_SECRET,
  apiUrl: 'http://localhost:'+process.env.PORT,
  webUrl: 'https://'+process.env.AOuth_HOST
}).login(['user', 'repo']);
// var state = auth_url.match(/&state=([0-9a-z]{32})/i);

console.log("auth_url:");
console.log(auth_url);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('Login', { title: 'issues', API_HOST:'github.com', CLIENT_ID:'d58a299ef179a8acc813'});
});

/* GET Login page. */
router.get('/issues', function(req, res, next) {
  var code = req.query.code;
  github.auth.login(code, function (err, token) {
   	console.log("err:");
   	console.log(err)
   	console.log("token:");
   	console.log(token)
   	res.render('index', { title: 'issues', token:token});
   	req.session.token = token;
  });
});

/* GET issues text. */
router.post('/getissues', function(req, res) {

	var assignee = req.body.assignee;
  	var username = req.body.username;
  	var password = req.body.password;
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
	
	var client = github.client({
	  username: username,
	  password: password
	},{
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
});

/* GET repo information. */
router.post('/getrepo', function(req, res) {

	var username = req.body.username;
  	var password = req.body.password;
	var repo = req.body.repo;
	console.log(username+','+password+','+repo+','+process.env.API_HOST);

	var client = github.client({
	  username: username,
	  password: password
	},{
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

});

router.post('/getmytag', function(req, res) {

	var username = req.body.username;
	var repo = req.body.repo;

	usertagsmodel.usertags.find({ username: username },function(err,data){
		var tagStr ="";
			for(let i=0;i<data.length;i++){
				tagStr += '{"tagName":"'+data[i].toObject().tagname+'","color":"'+data[i].toObject().tagcolour+'"},'
			}
			var tagJson = eval('(['+tagStr+'])');
			res.status(200).send(tagJson);
	})

});

/* GET issues comment. */
router.post('/getcomment', function(req, res) {

	var username = req.body.username;
  	var password = req.body.password;
	var repo = req.body.repo;
	var number = req.body.number;
	console.log(username+','+password+','+repo+','+number+','+global.apiUrl);

	var client = github.client({
	  username: username,
	  password: password
	},{
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
});

router.post('/getContent', function(req, res) {

	var username = req.body.username;
  	var password = req.body.password;
	var repo = req.body.repo;
	var number = req.body.number;
	console.log(username+','+password+','+repo+','+number+','+global.apiUrl);

	var client = github.client({
	  username: username,
	  password: password
	},{
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
});

router.post('/signin', function(req, res) {
	var username = req.body.username;
  	var password = req.body.password;
  	console.log(username+password);

	var client = github.client({
	  username: username,
	  password: password
	},{
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
});

router.post('/getuserimage', function(req, res) {

	var username = req.body.username;
  	var password = req.body.password;
  	console.log(username+password);

	var client = github.client({
	  username: username,
	  password: password
	},{
	  hostname: process.env.API_HOST
	});

	var ghme = client.me();
	ghme.info(function(err, data) {

  		if(err != null){
  			res.status(400).send('Error');
  		}else{
  			res.status(200).send(data.avatar_url);
  		};

	});
});

router.post('/getusertag', function(req, res) {

	var username = req.body.username;

	usertagsmodel.usertags.find({ username: username },function(err, data){

	  	var tagStr = "";
	  	if(err != null){
  			res.status(400).send('Error');
  		}else{

  			for(let i=0;i<data.length;i++){
				tagStr += '{"tagName":"'+data[i].toObject().tagname+'","color":"'+data[i].toObject().tagcolour+'"},'
			}
			tagStr = '['+tagStr+']';
  			res.status(200).send(tagStr);
  		};
	})

});

router.post('/removeusertag', function(req, res) {

	var username = req.body.username;
	var tagName = req.body.tagName;

	usertagsmodel.usertags.remove({ username: username, "tagname": tagName}, function (err) {
	  	if(err != null){
  			res.status(400).send('Error');
  		}else{
  			res.status(200).send('remove');
  		}; 
	});

});

router.post('/setusertag', function(req, res) {

	var username = req.body.username;
	var tagName = req.body.tagName;
	var tagcolour = req.body.tagcolour;

	var tagJSON = { "username": username, "tagname": tagName, "tagcolour": tagcolour };

	var userTagsJSON = new usertagsmodel.usertags(tagJSON);
	userTagsJSON.save(function(err, docs){
	    if(err != null){
  			res.status(400).send('Error');
  		}else{
  			res.status(200).send(docs);
  		};
	});

});

router.post('/setdescription', function(req, res) {

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

});


router.post('/getissuesByTag', function(req, res) {

	var usernameStr = req.body.username;
	var repoStr = req.body.repoStr;
	var usertagStr = req.body.usertagStr;
	var password = req.body.password;

	var client = github.client({
		  username: usernameStr,
		  password: password
		},{
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

});

router.post('/gettagwithinfo', function(req, res) {

	var usernameStr = req.body.username;
	var repoStr = req.body.repo;
	usertagsmodel.usertags.find({ username: usernameStr },function(err,data){
		var tagLength = data.length;
		var tagData = data;
		var currentTagIndex = 0;
		var TagJsonStr = "";
		getTagInfo();
		function getTagInfo(){
			if(currentTagIndex >= tagLength){
				var source = fs.readFileSync('../templates/userTag.hbs')
				var template = handlebars.compile(source.toString());
				var result = template(eval('(['+TagJsonStr+'])'));
				res.status(200).send(result); 
	        	return;
		    }
		    var tagNameStr = tagData[currentTagIndex].toObject().tagname;
		    var tagcolor = tagData[currentTagIndex].toObject().tagcolour;
		    userIssuesmodel.userissues.find({ username: usernameStr , repo: repoStr , 'tags.tagname':{ $in: tagNameStr}},function(err,issues){

		    	TagJsonStr += '{"tagName":"'+tagNameStr+'","color":"'+tagcolor+'","count":"'+issues.length+'"},'

		    	currentTagIndex++;
		    	getTagInfo();
		    })

		}
	});

});

module.exports = router;
