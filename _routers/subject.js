const router = require('express').Router();

const Subject = require('../_models/subjectModel');
const User = require('../_models/userModel');
const ModelController = require('../_prototypes/modelFunctions');
const Methods = require('../_methods/methods');
const mdlCon = new ModelController(Subject, Methods.getDatabaseName(Methods.currentYearRange()));
const UmdlCon = new ModelController(User, Methods.user());
const projection = {_id:0, createdAt:0, updatedAt:0, __v:0};

router.route('/')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        mdlCon.find(res, {}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No subjects found!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            }
        });
    })
    .post((req, res) => {
        if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission for that!'
            });
        }
        mdlCon.setDBName(req.dbName);
        mdlCon.create(req, res)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No subjects found!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            }
        });
    })

router.route('/profesor/:identification')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        UmdlCon.findOne(res, {username: req.params.identification}, projection)
        .then(result => {
            if(!result) {
                throw {
                    message: 'No user with that identification found!',
                    code: 404
                }
            }
            if(result.accountType !== 'Profesor') {
                throw {
                    message: 'The user you provided is not a profesor!',
                    code: 400
                }
            }
            else {
                return mdlCon.find(res, {profesors: {$in: [result.username]}}, projection);
            }
        })
        .then(result => {
            if(!result) {
                throw {
                    message: 'No subjects found!',
                    code: 404
                }
            }
            return res.status(200).send({
                good: true,
                data: result
            });
        })
        .catch(err => {
            return res.status(err.code).send({
                good: false,
                message: err.message
            });
        })
    })

router.route('/:identification')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        mdlCon.findOne(res, {shortname: req.params.identification}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No subject found!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            }
        });
    })
    .put((req, res) => {
        if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission for that!'
            });
        }
        if(req.body._id ||
        req.body.createdAt ||
        req.body.updatedAt ||
        req.body.__v || 
        req.body.shortname ||
        req.body.profesors)
        {
            return res.status(400).send({
                good: false,
                message: 'You can\'t do that!'
            });
        }
        else {
            mdlCon.setDBName(req.dbName);
            mdlCon.UpdateOne(req, res, {shortname: req.params.identification})
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No subject found!'
                    });
                }
                else {
                    return res.status(200).send({
                        good: true,
                        data: result
                    });
                }
            });
        }
    })

router.route('/:identification/profesors')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        mdlCon.findOne(res, {shortname: req.params.identification}, {profesors: 1})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No subject found!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            }
        });
    })
    .put((req, res) => {
        if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission for that!'
            });
        }
        mdlCon.setDBName(req.dbName);
        UmdlCon.findOne(res, {username: req.body.username}, projection)
        .then(result => {
            if(!result) {
                throw {
                    message: 'The username you provided doesn\'t exist!',
                    code: 404
                }
            }
            if(req.user.accountType === 'Moderator' && !(req.user.facility === result.facility)) {
                throw {
                    message: 'You can\'t add workers from facility you don\'t work at!',
                    code: 400
                }
            }
            if(result.accountType !== 'Profesor') {
                throw {
                    message: 'The user you provided is not a profesor!',
                    code: 400
                }
            }
            return mdlCon.findOne(res, {shortname: req.params.identification}, projection);
        })
        .then(result2 => {
            if(!result2) {
                throw {
                    message: 'Didn\'t find the subject you are looking for!',
                    code: 404
                }
            }
            if(result2.profesors.includes(req.body.username)) {
                throw {
                    message: 'That professor already teaches that subject!',
                    code: 400
                }
            }
            return mdlCon.UpdateArray({$push:{profesors:req.body.username}}, res, {shortname: req.params.identification});
        })
        .then(result => {
            if(!result) {
                throw {
                    message: 'No subject found!',
                    code: 404
                }
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            }
        })
        .catch(err => {
            return res.status(err.code).send({
                good: false,
                message: err.message
            });
        });
    })
    .delete((req, res) => {
        if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission for that!'
            });
        }
        mdlCon.setDBName(req.dbName);
        UmdlCon.findOne(res, {username: req.query.username}, projection)
        .then(result => {
            if(!result) {
                throw {
                    message: 'The username you provided doesn\'t exist!',
                    code: 404
                }
            }
            if(req.user.accountType === 'Moderator' && !(req.user.facility === result.facility)) {
                throw {
                    message: 'You can\'t delete workers from facility you don\'t work at!',
                    code: 400
                }
            }
            if(result.accountType !== 'Profesor') {
                throw {
                    message: 'The user you provided is not a profesor!',
                    code: 400
                }
            }
            return mdlCon.findOne(res, {shortname: req.params.identification}, projection);
        })
        .then(result => {
            if(!result) {
                throw {
                    message: 'Didn\'t find the subject you are looking for!',
                    code: 404
                }
            }
            if(!result.profesors.includes(req.query.username)) {
                throw {
                    message: 'That professor doesn\'t teach that subject!',
                    code: 400
                }
            }
            return mdlCon.UpdateArray({$pullAll:{profesors:[req.query.username]}}, res, {shortname: req.params.identification});
        })
        .then(result => {
            if(!result) {
                throw {
                    message: 'No subject found!',
                    code: 404
                }
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            }
        })
        .catch(err => {
            return res.status(err.code).send({
                good: false,
                message: err.message
            });
        });
    })

router.get('/:identification/profesors/preput', (req, res) => {
    if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission for that!'
        });
    }
    mdlCon.findOne(res, {shortname: req.params.identification}, projection)
    .then(result => {
        if(!result) {
            throw {
                message: 'Didn\'t find the subject you are looking for!',
                code: 404
            }
        }
        var query = {accountType: 'Profesor', username: {$nin: result.profesors}};
        if(req.user.accountType === 'Moderator') {
            query.facility = req.user.facility;
        }
        return UmdlCon.find(res, query, {username: 1});
    })
    .then(result => {
        if(!result) {
            throw {
                message: 'No viable profesors found!',
                code: 404
            }
        }
        else {
            return res.status(200).send({
                good: true,
                data: {
                    choice: result.map(a => a.username)
                }
            });
        }
    })
    .catch(err => {
        return res.status(err.code).send({
            good: false,
            message: err.message
        });
    });
});
router.get('/:identification/profesors/predelete', (req, res) => {
    if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission for that!'
        });
    }
    mdlCon.setDBName(req.dbName);
    mdlCon.findOne(res, {shortname: req.params.identification}, projection)
    .then(result => {
        if(!result) {
            throw {
                message: 'Didn\'t find the facility you are looking for!',
                code: 404
            }
        }
        else {
            var query = {username: {$in: result.profesors}};
            if(req.user.accountType === 'Moderator') {
                query.facility = req.user.facility;
            }
            return UmdlCon.find(res, query, {username: 1});
        }
    })
    .then(result => {
        if(!result) {
            throw {
                message: 'Didn\'t find any professors in your facility that teach this subject!',
                code: 404
            }
        }
        else {
            return res.status(200).send({
                good: true,
                data: {
                    choice: result.map(a => a.username)
                }
            });
        }
    })
    .catch(err => {
        return res.status(err.code).send({
            good: false,
            message: err.message
        });
    })
});

module.exports = router;
