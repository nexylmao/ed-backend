const mongoose = require('mongoose');

const _schoolYear = new mongoose.Schema({
    yearRange : {
        type: String,
        unique: true,
        required: true
    },
    active : {
        type: Boolean,
        required: true, 
        default: false
    },
    description: {
        type: String,
        default: 'Describe what\'s new this year!'
    },
    backgroundPic: {
        type: String,
        default: 'http://www.hddesktopbackgrounds.us/backgrounds-images/1920x1080/paove-desktop-1624526-1920x1080.jpg'
    }
},{collection:'SchoolYears'});

_schoolYear.plugin(require('mongoose-timestamp'));
_schoolYear.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('SchoolYear', _schoolYear);