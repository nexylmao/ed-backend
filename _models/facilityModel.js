const mongoose = require('mongoose');

const _facility = new mongoose.Schema({
    shortname: {
        type: String,
        required: true,
        unique: true
    },
    name : {
        type: String,
        required: true,
        unique: true
    },
    location : {
        type: String,
        default: "Enter the location where the school is!"
    },
    principal : {
        type: String,
        unique: true,
        required: true
    },
    profesors: {
        type: [String],
        required: true
    },
    picture: {
        type: String,
        default: 'https://n6-img-fp.akamaized.net/free-vector/school-building_23-2147521232.jpg?size=338&ext=jpg'
    },
    backgroundPicture: {
        type: String,
        default: 'https://i1.wp.com/kongres-meetologue.eu/wp-content/uploads/2017/08/novi-sad.jpg?fit=1920%2C1285'
    }
},{collection:'Facilities'});

_facility.plugin(require('mongoose-timestamp'));
_facility.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Facility', _facility);