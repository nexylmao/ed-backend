const router = require('express').Router();

const User = require('../_models/userModel');
const Methods = require('../_methods/methods');
const jsonWebToken = require('../_prototypes/jsonWebToken');
const jwt = new jsonWebToken();
const modelController = require('../_prototypes/modelFunctions');
const mdlCon = new modelController(User, Methods.user());
const EnvVariables = require('../_env/env');

router.route('/register')
    .post((req, res, next) => {
        if(EnvVariables.ALLOWREGISTER !== 'ENABLED') {
            return res.status(400).send({
                auth: false,
                message: 'Registrations are not enabled at this time!'
            });
        }
        mdlCon.create(req, res)
        .then(result => {
            if(!result) {
                return res.status(401).send({
                    auth: false,
                    message: 'You didn\'t provide all the needed data!'
                });
            }
            else {
                jwt.Sign(res, result)
                .then(token => {
                    return res.status(200).send({
                        auth: true,
                        token
                    });
                });
            }
        });
    })

router.route('/login')
    .post((req, res, next) => {
        let query = {$or: [{username: req.body.identification},{email:req.body.identification}]};
        mdlCon.findOne(res, query, {})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    auth: false,
                    message: 'No user was found!'
                });
            }
            else {
                if(result.validPassword(req.body.password)) {
                    jwt.Sign(res, result)
                    .then(token => {
                        return res.status(200).send({
                            auth: true,
                            token
                        });
                    });
                }
                else {
                    return res.status(401).send({
                        auth: false,
                        message: 'You entered a wrong password!'
                    })
                }
            }
        });
    });

module.exports = router;