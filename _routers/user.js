const router = require('express').Router();

const User = require('../_models/userModel');
const Facility = require('../_models/facilityModel');
const Methods = require('../_methods/methods');
const modelController = require('../_prototypes/modelFunctions');
const mdlCon = new modelController(User, Methods.user());
const FmdlCon = new modelController(Facility, Methods.data());

router.route('/')
    .get((req, res) => {
        var query = {accountType: {$ne: 'Administrator'}};
        if (req.user.accountType !== 'Student' && req.user.accountType !== 'Parent') {
            query = {};
        }
        mdlCon.find(res, query, {_id:0, createdAt:0, updatedAt:0, password:0})
        .then(result => {
            if (!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No users found!'
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
        if (req.user.accountType === 'Administrator' || (
            req.user.accountType === 'Moderator' && (
                req.body.accountType !== 'Administrator' &&
                req.body.accountType !== 'Moderator'
            )
        )) {
            req.body.children = [];
            if(req.user.accountType === 'Moderator' && req.body.facility !== req.user.facility) {
                req.body.facility = req.user.facility;
                var message = 'You can\'t set the facility to one you\'re not part of - Auto-Setting to your!';
            }
            mdlCon.create(req, res)
            .then(result => {
                var returning = {
                    good: true,
                    data: result
                };
                if(message) {
                    returning.message = message;
                }
                if(req.body.accountType === 'Profesor' && req.body.facility !== '') {
                    FmdlCon.UpdateArray({$push:{profesors:req.body.username}}, res, req.body.facility);
                }
                return res.status(200).send(returning);
            });
        }
        else {
            return res.status(401).send({
                good: false,
                message: 'You don\'t have permission for this!'
            })
        }
    })

router.route('/type/:type')
    .get((req, res) => {
        if((req.user.accountType === 'Student' || req.user.accountType === 'Parent') && req.params.type === 'Administrator') {
            return res.status(404).send({
                good: false,
                message: 'No users found!'
            });
        }
        else {
            mdlCon.find(res, {accountType: req.params.type}, {_id:0, password:0, __v:0})
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No users found!'
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

router.route('/facility/:facility')
.get((req, res) => {
    var query = {accountType: {$ne: 'Administrator'}, facility: req.params.facility};
    if(!(req.user.accountType === 'Student' || req.user.accountType === 'Parent'))
    {
        query = {facility: req.params.facility};
    }
    mdlCon.find(res, query, {_id:0, password:0, __v:0})
    .then(result => {
        if(!result) {
            return res.status(404).send({
                good: false,
                message: 'No users found!'
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

router.route('/me')
	.get((req, res) => {
		mdlCon.find(res, req.user, {_id:0, createdAt:0, updatedAt:0, password:0})
		.then(result => {
			if(!result) {
				return res.status(404).send({
					good: false,
					message: 'We couldn\'t find you ?'
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
		if(!(req.body.accountType ||
		req.body.__v ||
		req.body._id ||
		req.body.createdAt ||
		req.body.updatedAt ||
		req.body.username ||
		req.body.children ||
		req.body.facility ||
		req.body.class ||
		req.body.password)){
			mdlCon.UpdateOne(req, res, req.user)
			.then(result => {
				if (!result) {
					return res.status(404).send({
						good: false,
						message: 'We couldn\'t find you ?'
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
			})
		}
	})

    router.route('/:identification/facility')
    .put((req, res) => {
        if(req.user.accountType === 'Administrator') {
            var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}],accountType: {$ne: 'Administrator'}};
            mdlCon.findOne(res, query, {_id:0, createdAt:0, updatedAt:0, password:0})
            .then(result => {
                if (!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No user found!'
                    });
                }
                if (result.facility !== '' && result.accountType === 'Profesor') {
                    FmdlCon.UpdateArray({$pop:{profesors: result.username}}, res, result.facility);
                }
                var object = {}
                object.body = {facility: req.body.facility};
                mdlCon.UpdateOne(object, res, query)
                .then(result2 => {
                    if (!result2) {
                        return res.status(404).send({
                            good: false,
                            message: 'No user found!'
                        });
                    }
                    if (req.body.facility !== '' && result2.accountType === 'Profesor') {
                        FmdlCon.UpdateArray({$push:{profesors: result.username}}, res, req.body.facility);
                    }
                    else {
                        return res.status(200).send({
                            good: true,
                            data: result2
                        });
                    }
                });
            });
        }
        else {
            return res.status(401).send({
				good: false,
				message: 'You don\'t have permission to do that!'
			});
        }
    })

router.delete('/:identification/children', (req, res) => {
    console.log('id/children!');
    console.log(req.query);
    if(req.user.accountType === 'Administrator' || req.user.accountType === 'Moderator') {
        var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}]};
        mdlCon.findOne(res, query, {_id:0, createdAt:0, updatedAt:0, password:0})
        .then(result => {
            if (!result) { 
                return res.status(404).send({
                    good: false,
                    message: 'No user found!'
                });
            }
            if (result.facility !== req.user.facility && req.user.accountType === 'Moderator') {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a parent that is not in your facility!'
                });
            }
            if (result.accountType !== 'Parent') {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t delete a child from a non-parent account!'
                });
            }
            else {
                mdlCon.UpdateArray({$pullAll: {children: [req.query.username]}}, res, query)
                .then(result3 => {
                    return res.status(200).send({
                        good: true,
                        data: result3
                    });
                });
            }
        });
    }
    else {
        return res.status(401).send({
            good: false,
            message: 'You don\'t have permission to do that!'
        });
    }
})

router.route('/:identification/children')
    .get((req, res) => {
        var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}]};
        if(req.user.accountType === 'Student' || req.user.accountType === 'Parent') {
            query.accountType = {$ne: 'Administrator'};
        }
        mdlCon.findOne(res, query,  {_id:0, createdAt:0, updatedAt:0, password:0})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No user was found!'
                })
            }
            if(result.accountType !== 'Parent') {
                return res.status(400).send({
                    good: false,
                    message: 'Non-parents don\'t have children! (Atleast in this application!)'
                });
            }
            else {
                return res.status(200).send({
                    good: true,
                    data: result.children
                });
            }
        });
    })
    .put((req, res) => {
        if(req.user.accountType === 'Administrator' || req.user.accountType === 'Moderator') {
            var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}]};
            mdlCon.findOne(res, query, {_id:0, createdAt:0, updatedAt:0, password:0})
            .then(result => {
                if (!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No user found!'
                    });
                }
                if (result.accountType !== 'Parent') {
                    return res.status(400).send({
                        good: false,
                        message: 'You can\'t add a child to a non-parent account!'
                    });
                }
                else {
                    mdlCon.findOne(res, {username: req.body.username}, {_id:0, createdAt:0, updatedAt:0, password:0})
                    .then(result2 => {
                        if(result2.accountType !== 'Student') {
                            return res.status(400).send({
                                good: false,
                                message: 'That\'s not a child!'
                            });
                        }
                        else {
                            mdlCon.UpdateArray({$push: {children: req.body.username}}, res, query)
                            .then(result3 => {
                                return res.status(200).send({
                                    good: true,
                                    data: result3
                                });
                            });
                        }
                    })
                }
            });
        }
        else {
            return res.status(401).send({
				good: false,
				message: 'You don\'t have permission to do that!'
			});
        }
    })

router.route('/:identification')
    .get((req, res) => {
        var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}],accountType: {$ne: 'Administrator'}};
        if(req.user.accountType !== 'Student' || req.user.accountType !== 'Parent') {
            query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}]};
        }
        mdlCon.findOne(res, query, {_id:0, createdAt:0, updatedAt:0, password:0})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No users found!'
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
        if (req.user.accountType === 'Administrator') {
            var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}]};
            mdlCon.UpdateOne(req, res, query)
            .then(result => {
				if (!result) {
					return res.status(404).send({
						good: false,
						message: 'No user was found!'
					});
				}
                return res.status(200).send({
                    good: true,
                    data: result
                });
            });
        }
        else {
            return res.status(401).send({
                good: false,
                message: 'You don\'t have permission for this!'
            });
        }
	})
	.delete((req, res) => {
        console.log('id!');
		if (req.user.accountType === 'Administrator' || (
            req.user.accountType === 'Moderator' && (
                req.body.accountType !== 'Administrator' &&
                req.body.accountType !== 'Moderator'
            )
        )) {
			var query = {$or : [{username: req.params.identification},{fullname: req.params.identification},{email: req.params.identification}]};
			mdlCon.DeleteOne(res, query)
			.then(result => {
				if(!result) {
					return res.status(404).send({
						good: false,
						message: 'No user was found!'
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
                message: 'You don\'t have permission for this!'
            });
		}
	})

module.exports = router;
