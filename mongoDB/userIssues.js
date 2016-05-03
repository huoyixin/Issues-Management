var mongoose = require('./mongoose');
var Schema = mongoose.mongoose.Schema;
var TagsSchema = new Schema({
    tagname : String,
    tagcolour : String
});
var IssuesSchema = new Schema({
	username : String,
    repo : String,
    description: String,
    issues_id : Number,
    tags:[TagsSchema]
});

exports.userissues = mongoose.mongoose.model('userissues', IssuesSchema);