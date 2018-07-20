const router = require('express').Router();

const Facility = require('../_models/facilityModel');
const User = require('../_models/userModel');
const Methods = require('../_methods/methods');
const modelController = require('../_prototypes/modelFunctions');
const mdlCon = new modelController(Facility, Methods.data());
const UmdlCon = new modelController(User, Methods.user());
const projection = {_id:0, createdAt:0, updatedAt:0, __v:0};

router.route('/')
    .get((req, res) => {
        var query = {};
        mdlCon.find(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No facilities found!'
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
        if(req.user.accountType === 'Administrator') {
            mdlCon.create(req, res)
            .then(result => {
                var object = {};
                object.body = {facility: result.shortname};
                UmdlCon.UpdateOne(object, res, {username: result.principal});
                return res.status(200).send({
                    good: true,
                    data: result
                });
            });
        }
        else {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission to do that!'
            });
        }
    })

router.route('/:identification')
    .get((req, res) => {
        var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No facility found!'
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
        if(!(req.user.accountType === 'Moderator' || req.user.accountType === 'Administrator')) {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission to do that!'
            });
        }
        var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(req.user.accountType === 'Administrator' || 
                (req.user.accountType === 'Moderator' &&
                req.user.facility === result.shortname
            )) {
                if(!(req.body._id ||
                req.body.createdAt ||
                req.body.updatedAt ||
                req.body.__v ||
                req.body.shortname
                )) {
                    mdlCon.UpdateOne(req, res, query)
                    .then(result => {
                        if(!result) {
                            return res.status(404).send({
                                good: false,
                                message: 'What happend?'
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
                else {
                    return res.status(401).send({
                        good: false,
                        message: 'You can\'t do that!'
                    });
                }
            }
            else {
                return res.status(401).send({
                    good: false,
                    message: 'You can\'t edit a facility you\'re not part of!'
                });
            }
        });
    })
    .delete((req, res) => {
        if(req.user.accountType === 'Administrator') {
            var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
            mdlCon.DeleteOne(res, query)
            .then(result => {
                if(!result) {
                    return res.status(400).send({
                        good: false,
                        message: 'Something went wrong!'
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
        else {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission to do that!'
            });
        }
    })

router.route('/:identification/profesors')
.get((req, res) => {
    var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
    mdlCon.findOne(res, query, {profesors:1})
    .then(result => {
        if(!result) {
            return res.status(404).send({
                good: false,
                message: 'No facility found!'
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
    if(!(req.user.accountType === 'Moderator' || req.user.accountType === 'Administrator')) {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission to do that!'
        });
    }
    var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
    mdlCon.findOne(res, query, projection)
    .then(result => {
        if(req.user.accountType === 'Administrator' || 
            (req.user.accountType === 'Moderator' &&
            req.user.facility === result.shortname
        )) {
            var userQuery = {username: req.body.username};
            UmdlCon.findOne(res, userQuery, projection)
            .then(result => {
                if (!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'The user you are looking for doesn\'t exist!'
                    });
                }
                if  (result.accountType !== 'Profesor') {
                    return res.status(400).send({
                        good: false,
                        message: 'That user is not a profesor!'
                    });
                }
                else {
                    mdlCon.UpdateArray({$push:{profesors:req.body.username}}, res, query)
                    .then(result2 => {
                        if(!result2) {
                            return res.status(404).send({
                                good: false,
                                message: 'WHAAT?'
                            });
                        }
                        else {
                            UmdlCon.UpdateOne({body:{facility:result2.shortname}}, res, result);
                            return res.status(200).send({
                                good: true,
                                data: result2
                            });
                        }
                    });
                }
            })
        }
        else {
            return res.status(401).send({
                good: false,
                message: 'You can\'t edit a facility you\'re not part of!'
            });
        }
    });
})
.delete((req, res) => {
    if(!(req.user.accountType === 'Moderator' || req.user.accountType === 'Administrator')) {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission to do that!'
        });
    }
    var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
    UmdlCon.findOne(res, {username: req.query.username}, projection)
    .then(result => {
        if(!result) {
            return res.status(404).send({
                good: false,
                message: 'Didn\'t find the user you are looking for!'
            });
        }
        if(result.accountType !== 'Profesor') {
            return res.status(404).send({
                good: false,
                message: 'The user you are looking for isn\'t a profesor!'
            });
        }
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result.profesors.includes(req.query.username)) {
                return res.status(404).send({
                    good: false,
                    message: 'That profesor isn\'t part of this facility!'
                });
            }
            if(req.user.accountType === 'Administrator' || 
                (req.user.accountType === 'Moderator' &&
                req.user.facility === result.shortname
            )) {
                mdlCon.UpdateArray({$pullAll:{profesors:[req.query.username]}}, res, query)
                .then(result => {
                    if(!result) {
                        return res.status(404).send({
                            good: false,
                            message: 'What happend?'
                        });
                    }
                    else {
                        UmdlCon.UpdateOne({body: {facility:''}}, res, {username: req.query.username});
                        return res.status(200).send({
                            good: true,
                            data: result
                        });
                    }
                });
            }
            else {
                return res.status(401).send({
                    good: false,
                    message: 'You can\'t edit a facility you\'re not part of!'
                });
            }
        });
    });
})

router.get('/:identification/profesors/preput', (req, res) => {
    if(!(req.user.accountType === 'Moderator' || req.user.accountType === 'Administrator')) {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission to do that!'
        });
    }
    else {
        UmdlCon.find(res, {facility: ''}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'Found no professors that don\'t have a facility!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: {
                        choices: result
                    }
                });
            }
        });
    }
});
router.get('/:identification/profesors/predelete', (req, res) => {
    if(!(req.user.accountType === 'Moderator' || req.user.accountType === 'Administrator')) {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission to do that!'
        });
    }
    else {
        var query = {$or: [{shortname:req.params.identification},{name:req.params.identification},{principal:req.params.identification}]};
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'Didn\'t find the facility you are looking for!'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: {
                        choices: result.profesors
                    }
                });
            }
        });
    }
});

module.exports = router;
