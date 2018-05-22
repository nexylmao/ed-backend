const modelFunctions = require('../_prototypes/modelFunctions');
const authFunctions = require('../_prototypes/jsonWebToken');
const User = require('../_models/userModel');
const Methods = require('../_methods/methods');
const databaseName = Methods.user();

module.exports = (req, res, next) => {
    let mf = new modelFunctions(User, databaseName);
    let af = new authFunctions();
    af.Verify(res, req.headers['x-access-token'])
    .then(result => {
        mf.findOne(res, {_id: result.id})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    auth: false,
                    message: 'You\'re not logged in!'
                });
            }
            else {
                req.user = result;
                next();
            }
        });
    });
}