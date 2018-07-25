const mongoose = require('mongoose');

const _subject = new mongoose.Schema({
    shortname : {
        type: String,
        required: true
    },
    name : {
        type: String,
        require: true
    },
    profesors : {
        type: [String],
        require: true,
        default: []
    },
    minimumGradeCount : {
        type: Number,
        required: true,
        default: 3
    },
    picture: {
        type: String,
        default: 'http://picresize.com/images/rsz_study-material-1.jpg'
    },
    description: String
},{collection:'Subjects'});

_subject.plugin(require('mongoose-timestamp'));
_subject.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Subject',_subject);
