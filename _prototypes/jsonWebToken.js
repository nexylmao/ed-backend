const jwt = require('jsonwebtoken');

const ErrorHandler = require('./errorHandler');
const EnviromentVariables = require('../_env/env');

function JsonWebToken() {}
JsonWebToken.prototype.Sign = (res, user) => {
    return new Promise(resolve => {
        jwt.sign({id: user.id}, EnviromentVariables.SECRET, {expiresIn: 86400}, (err, token) => {
            if (err) {
                let errHandler = new ErrorHandler();
                errHandler.Handle(res, 'Something went wrong while signing the token!', err);
            }
            resolve(token);
        });
    });
}
JsonWebToken.prototype.Verify = (res, token) => {
    return new Promise(resolve => {
		jwt.verify(token, EnviromentVariables.SECRET, (err, decoded) => {
			if (err) {
                let errHandler = new ErrorHandler();
				errHandler.Handle(res, 'Something went wrong while verifying your token!', err);
			}
			resolve(decoded);
		});
	});
}

module.exports = JsonWebToken;