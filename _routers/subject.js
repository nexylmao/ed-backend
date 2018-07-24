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
                return res.status(404).send({
                    good: false,
                    message: 'No user with that identification found!'
                });
            }
            if(result.accountType !== 'Profesor') {
                return res.status(400).send({
                    good: false,
                    message: 'The user you provided is not a profesor!'
                });
            }
            else {
                mdlCon.find(res, {profesors: {$in: [result.username]}}, projection)
                .then(result => {
                    if(!result) {
                        return res.status(404).send({
                            good: false,
                            message: 'No subjects found!'
                        });
                    }
                    return res.status(200).send({
                        good: true,
                        data: result
                    });
                });
            }
        });
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
                return res.status(404).send({
                    good: false,
                    message: 'The username you provided doesn\'t exist!'
                });
            }
            if(req.user.accountType === 'Moderator' && !(req.user.facility === result.facility)) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t add workers from facility you don\'t work at!'
                });
            }
            if(result.accountType !== 'Profesor') {
                return res.status(400).send({
                    good: false,
                    message: 'The user you provided is not a profesor!'
                });
            }
            mdlCon.findOne(res, {shortname: req.params.identification}, projection)
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'Didn\'t find the subject you are looking for!'
                    });
                }
                if(result.profesors.includes(req.body.username)) {
                    return res.status(400).send({
                        good: false,
                        message: 'That professor already teaches that subject!'
                    });
                }
                mdlCon.UpdateArray({$push:{profesors:result.username}}, res, {shortname: req.params.identification})
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
                return res.status(404).send({
                    good: false,
                    message: 'The username you provided doesn\'t exist!'
                });
            }
            if(req.user.accountType === 'Moderator' && !(req.user.facility === result.facility)) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t delete workers from facility you don\'t work at!'
                });
            }
            if(result.accountType !== 'Profesor') {
                return res.status(400).send({
                    good: false,
                    message: 'The user you provided is not a profesor!'
                });
            }
            mdlCon.findOne(res, {shortname: req.params.identification}, projection)
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'Didn\'t find the subject you are looking for!'
                    });
                }
                if(!result.profesors.includes(req.query.username)) {
                    return res.status(400).send({
                        good: false,
                        message: 'That professor doesn\'t teach that subject!'
                    });
                }
                mdlCon.UpdateArray({$pullAll:{profesors:[result.username]}}, res, {shortname: req.params.identification})
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
            return res.status(404).send({
                good: false,
                message: 'Didn\'t find the subject you are looking for!'
            });
        }
        var query = {accountType: 'Profesor', username: {$nin: result.profesors}};
        if(req.user.accountType === 'Moderator') {
            query.facility = req.user.facility;
        }
        UmdlCon.find(res, query, {username: 1})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No viable profesors found!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: {
                        choice: result.map(a => a.username)
                    }
                });
            }
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
            return res.status(404).send({
                good: false,
                message: 'Didn\'t find the facility you are looking for!'
            });
        }
        else {
            var query = {username: {$in: result.profesors}};
            if(req.user.accountType === 'Moderator') {
                query.facility = req.user.facility;
            }
            UmdlCon.find(res, query, {username: 1})
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'Didn\'t find any professors in your facility that teach this subject!'
                    });
                }
                else {
                    return res.status(200).send({
                        good: true,
                        data: {
                            choice: result.map(a => a.username)
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
