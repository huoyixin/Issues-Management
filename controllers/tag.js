'use strict'

var fs = require('fs');
var handlebars = require('handlebars');
var userIssuesmodel = require('../mongoDB/userissues.js');
var usertagsmodel = require('../mongoDB/usertags.js');

exports.getMytag = function(req, res) {

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

}

exports.getUserTag = function(req, res) {

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

}

exports.removeUserTag = function(req, res) {

	var username = req.body.username;
	var tagName = req.body.tagName;

	usertagsmodel.usertags.remove({ username: username, "tagname": tagName}, function (err) {
	  	if(err != null){
  			res.status(400).send('Error');
  		}else{
  			res.status(200).send('remove');
  		}; 
	});

}

exports.setUserTag = function(req, res) {

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

}

exports.getTagWithInfo = function(req, res) {

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

}