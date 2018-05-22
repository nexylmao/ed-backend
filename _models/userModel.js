const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const _user = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	username: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	accountType: {
		type: String,
		required: true,
		enum: ['Student', 'Parent', 'Profesor', 'Moderator', 'Administrator'],
		default: 'Student'
	},
	password: {
		type: String,
		required: true
	},
	facility: String,
	children: [String],
	class: String,
	fullname: String,
	picture: {
		type: String,
		default: 'https://orig00.deviantart.net/beeb/f/2010/341/1/3/facebook_chi__chis_sweet_home__by_sinkillerj-d34f0su.png'
	},
	backgroundPicture: {
		type: String,
		default: 'http://papers.co/wallpaper/papers.co-ns23-night-sky-sunset-pink-nature-36-3840x2400-4k-wallpaper.jpg'
	}
}, {collection: 'users'});

_user.pre('save', function (next) {
	const doc = this;
    bcrypt.hash(doc.password, 10, (err, hash) => {
    	if (err) {
            console.log('Something went wrong while hashing the password!');
            return next(err.message);
    	}
    	doc.password = hash;
        next();
    });
});

_user.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

_user.plugin(require('mongoose-timestamp'));
_user.plugin(require('mongoose-unique-validator'));

const User = mongoose.model('User', _user);
module.exports = User;
