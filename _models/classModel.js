const mongoose = require('mongoose');

const _subject = new mongoose.Schema({
    profesor: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    }
});

const _class = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    facility : {
        type: String,
        required: true
    },
    homeTeacher : {
        type: String, 
        required: true
    },
    students : {
        type: [String],
        required: true,
        default: []
    },
    subjects: {
        type: [_subject],
        required: true,
        default: []
    },
    picture: {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/previews/000/134/505/original/free-vector-classroom.jpg'
    }
}, {collection: 'Classes'});

_class.plugin(require('mongoose-timestamp'));
_class.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Class', _class);