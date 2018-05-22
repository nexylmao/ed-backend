const router = require('express').Router();

const SchoolYear = require('../_models/schoolYearsModel');
const modelController = require('../_prototypes/modelFunctions');
const Methods = require('../_methods/methods');
const mdlCon = new modelController(SchoolYear, Methods.data());
const projection = {_id:0, createdAt:0, updatedAt:0, __v:0};

router.route('/')
    .get((req, res) => {
        mdlCon.find(res, {}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No School Years found!'
                });
            }
            return res.status(200).send({
                good: true,
                data: result
            });
        });
    })
    .post((req, res) => {
        if(req.user.accountType === 'Administrator') {
            if(req.body.year) {
                req.body.yearRange = Methods.constructYearRange(req.body.year);
            }
            else {
                req.body.yearRange = Methods.currentYearRange();
            }
            mdlCon.create(req, res)
            .then(result => {
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

router.route('/small')
.get((req, res) => {
    mdlCon.find(res, {}, {yearRange:1, active:1})
    .then(result => {
        if(!result) {
            return res.status(404).send({
                good: false,
                message: 'No School Years found!'
            });
        }
        return res.status(200).send({
            good: true,
            data: result
        });
    });
})

router.route('/:range')
    .get((req, res) => {
        mdlCon.findOne(res, {yearRange: req.params.range}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No School Year found!'
                });
            }
            return res.status(200).send({
                good: true,
                data: result
            });
        });
    })
    .put((req, res) => {
        if(req.user.accountType === 'Administrator') {
            if(req.body.yearRange ||
            req.body._id ||
            req.body.createdAt ||
            req.body.updatedAt ||
            req.body.__v ||
            req.body.active) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t do that!'
                });
            }
            else {
                mdlCon.UpdateOne(req, req, {yearRange: req.params.range})
                .then(result => {
                    if(!result) {
                        return res.status(404).send({
                            good: false,
                            message: 'No School Year found!'
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
        }
        else {
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission to do that!'
            });
        }
    })

router.route('/:range/flip')
    .put((req, res) => {
        if(req.user.accountType === 'Administrator') {
            mdlCon.findOne(res, {yearRange: req.params.range}, projection)
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No School Year found!'
                    });
                }
                else {
                    req.body = {};
                    req.body.active = !result.active;
                    mdlCon.UpdateOne(req, res, {yearRange: req.params.range})
                    .then(result2 => {
                        if(!result2) {
                            return res.status(404).send({
                                good: false,
                                message: 'No School Year found!'
                            });
                        }
                        else {
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
            return res.status(403).send({
                good: false,
                message: 'You don\'t have permission to do that!'
            });
        }
    })

module.exports = router;