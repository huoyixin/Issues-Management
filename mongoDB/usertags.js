var mongoose = require('./mongoose');
var Schema = mongoose.mongoose.Schema;
var TagsSchema = new Schema({
	username : String,
    tagname : String,
    tagcolour : String
});

exports.usertags = mongoose.mongoose.model('usertags', TagsSchema);