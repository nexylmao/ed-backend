const router = require('express').Router();
const _ = require('underscore');

const Class = require('../_models/classModel');
const User = require('../_models/userModel');
const Subject = require('../_models/subjectModel');
const ModelController = require('../_prototypes/modelFunctions');
const Methods = require('../_methods/methods');
const mdlCon = new ModelController(Class, Methods.getDatabaseName(Methods.currentYearRange()));
const UmdlCon = new ModelController(User, Methods.user());
const SmdlCon = new ModelController(Subject, Methods.getDatabaseName(Methods.currentYearRange()));
const projection = {_id:0, createdAt:0, updatedAt:0, __v:0};

router.route('/')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        var query = {facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {};
        }
        mdlCon.find(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No classes found!'
                });
            }
            return res.status(200).send({
                good: true,
                data: result
            });
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
        if(req.user.accountType === 'Moderator' && req.body.facility !== req.user.facility) {
            req.body.facility = req.user.facility;
            var message = 'You can\'t set the facility to one you\'re not part of - Auto-Setting to your!';
        }
        req.body.subjects = [];
        req.body.students = [];
        UmdlCon.findOne(res, {username: req.body.homeTeacher}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'The user you provided doesn\'t exist!'
                });
            }
            if(result.accountType !== 'Profesor') {
                return res.status(404).send({
                    good: false,
                    message: 'The user you provided is not a profesor!'
                });
            }
            mdlCon.create(req, res)
            .then(result => {
                return res.status(200).send({
                    good: true,
                    data: result
                });
            });
        });
    })

router.route('/my/classes')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        if(req.user.accountType === 'Student') {
            return res.status(200).send({
                good: true,
                data: [req.user.class]
            });
        }
        if(req.user.accountType === 'Parent') {
            UmdlCon.find(res, {username: {$in: req.user.children}}, projection)
            .then(result => {
                result = result.map(a => a.name);
                return res.status(200).send({
                    good: true,
                    data: _.uniq(result)
                });
            });
        };
        if(req.user.accountType === 'Profesor') {
            mdlCon.find(res, {subjects: {$elemMatch: {profesor: req.user.username}}}, projection)
            .then(result => {
                result = result.map(a => a.name);
                return res.status(200).send({
                    good: true,
                    data: _.uniq(result)
                });
            });
        };
        if(req.user.accountType === 'Moderator') {
            mdlCon.find(res, {facility: req.user.facility}, projection)
            .then(result => {
                result = result.map(a => a.name);
                return res.status(200).send({
                    good: true,
                    data: _.uniq(result)
                });
            });
        };
        if(req.user.accountType === 'Administrator') {
            mdlCon.find(res, {}, projection)
            .then(result => {
                result = result.map(a => a.name);
                return res.status(200).send({
                    good: true,
                    data: _.uniq(result)
                });
            });
        };
    });

router.route('/:identification')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            return res.status(200).send({
                good: true,
                data: result
            });
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
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result1 => {
            if(!result1) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            if(req.user.accountType === 'Moderator' && req.user.facility !== result.facility) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a class in facility you\'re not a part of!'
                });
            }
            if(req.body._id ||
            req.body.createdAt ||
            req.body.updatedAt ||
            req.body.__v ||
            req.body.name ||
            req.body.facility) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t do that!'
                });
            } 
            else {
                if(req.body.homeTeacher) {
                    UmdlCon.findOne(res, {username: req.body.homeTeacher}, projection)
                    .then(result2 => {
                        if(!result2) {
                            return res.status(404).send({
                                good: false,
                                message: 'The user you provided doesn\'t exist!'
                            });
                        }
                        if(result2.accountType !== 'Profesor') {
                            return res.status(404).send({
                                good: false,
                                message: 'The user you provided is not a profesor!'
                            });
                        }
                        if(result2.facility !== result1.facility) {
                            return res.status(400).send({
                                good: false,
                                message: 'You can\'t assign a profesor that\'s not a part of the classes facility!'
                            });
                        }
                        mdlCon.UpdateOne(req, res, query)
                        .then(result3 => {
                            return res.status(200).send({
                                good: true,
                                data: result3
                            });
                        });
                    });
                }
                else {
                    mdlCon.UpdateOne(req, res, query)
                    .then(result => {
                        return res.status(200).send({
                            good: true,
                            data: result
                        });
                    });
                }
            }
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
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result1 => {
            if(!result1) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            if(result1.facility !== req.user.facility && req.user.accountType === 'Moderator') {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t delete a class in facility you\'re not a part of!'
                });
            }
            mdlCon.DeleteOne(res, query)
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No class found!'
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
    })

router.route('/:identification/students')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, {students: 1})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            return res.status(200).send({
                good: true,
                data: result
            });
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
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            if(req.user.accountType === 'Moderator' && result.facility !== req.user.facility) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a class that is not in your facility!'
                });
            }
            UmdlCon.findOne(res, {username: req.body.username}, projection)
            .then(result1 => {
                if(!result1) {
                    return res.status(404).send({
                        good: false,
                        message: 'No user you provided was found!'
                    });
                }
                if(result1.accountType !== 'Student'){
                    return res.status(400).send({
                        good: false,
                        message: 'User you provided is not a student!'
                    });
                }
                if(result1.facility !== result.facility) {
                    return res.status(400).send({
                        good: false,
                        message: 'Student you provided is not a part of the facility you are!'
                    });
                }
                else {
                    mdlCon.UpdateArray({$push:{students:result1.username}}, res, query)
                    .then(result => {
                        if(!result) {
                            return res.status(404).send({
                                good: false,
                                message: 'No class was found!'
                            });
                        }
                        else {
                            UmdlCon.UpdateOne({body:{class:result.name}}, res, {username: result1.username});
                            return res.status(200).send({
                                good: true,
                                data: result
                            });
                        }
                    })
                }
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
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            if(req.user.accountType === 'Moderator' && result.facility !== req.user.facility) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a class that is not in your facility!'
                });
            }
            mdlCon.UpdateArray({$pullAll:{students:req.body.username}}, res, query)
            .then(result => {
                if(!result) {
                    return res.status(404).send({
                        good: false,
                        message: 'No class was found!'
                    });
                }
                else {
                    UmdlCon.UpdateOne({body: {class:''}}, res, {username: req.body.username});
                    return res.status(200).send({
                        good: true,
                        data: result
                    });
                }
            });
        });
    })

router.get('/:identification/students/preput', (req, res) => {
    if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission for that!'
        });
    }
    else {
        mdlCon.findOne(res, {name: req.params.identification}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'The class you are looking for doesn\'t exist!'
                });
            }
            if(req.user.accountType === 'Moderator' && result.facility !== req.user.facility) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a class that is not in your facility!'
                });
            }
            var query = {username: {$nin: result.students}, class: ''};
            if(req.user.accountType === 'Moderator') {
                query.facility = req.user.facility;
            }
            UmdlCon.find(res, query, projection)
            .then(result => {
                if(!result || result.length === 0) {
                    return res.status(404).send({
                        good: false,
                        message: 'Didn\'t find any students viable to add!'
                    });
                }
                else {
                    return res.status(200).send({
                        good: true,
                        data: {
                            choices: result.map(a => a.username)
                        }
                    });
                }
            });
        });
    }
});

router.get('/:identification/students/predelete', (req, res) => {
    if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission for that!'
        });
    }
    else {
        mdlCon.findOne(res, {name: req.params.identification}, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'Didn\'t find the class you are looking for!'
                });
            }
            if(req.user.accountType === 'Moderator' && result.facility !== req.user.facility) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a class that is not in your facility!'
                });
            }
            return res.status(200).send({
                good: true,
                data: {
                    choices: result.students
                }
            }); 
        });
    }
});

router.route('/:identification/subjects')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, {subjects: 1})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            return res.status(200).send({
                good: true,
                data: result
            });
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
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            if(result.facility !== req.user.facility && req.user.accountType === 'Moderator') {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit a class that is not in your facility!'
                });
            }
            let query2 = query;
            query2.subjects = {$elemMatch: {subject: req.body.shortname, profesor: req.body.username}};
            mdlCon.findOne(res, query2, {subjects: 1})
            .then(result => {
                if(result) {
                    return res.status(400).send({
                        good: false,
                        message: 'That teacher already teaches that subject in this class!'
                    });
                }
                SmdlCon.setDBName(req.dbName);
                UmdlCon.findOne(res, {username: req.body.username}, projection)
                .then(result1 => {
                    if(!result1) {
                        return res.status(404).send({
                            good: false,
                            message: 'No user you provided was found!'
                        });
                    }
                    if(result1.accountType !== 'Profesor'){
                        return res.status(400).send({
                            good: false,
                            message: 'User you provided is not a profesor!'
                        });
                    }
                    if(result1.facility !== result.facility) {
                        return res.status(400).send({
                            good: false,
                            message: 'Profesor you provided is not a part of the facility you are!'
                        });
                    }
                    else {
                        SmdlCon.findOne(res, {shortname: req.body.shortname}, projection)
                        .then(result2 => {
                            if(!result2) {
                                return res.status(404).send({
                                    good: false,
                                    message: 'No subject was found!'
                                });
                            }
                            if(!(result2.profesors.includes(result1.username))) {
                                return res.status(400).send({
                                    good: false,
                                    message: 'The profesor you provided doesn\'t teach that subject!'
                                });
                            }
                            else {
                                var object = {
                                    profesor: req.body.username,
                                    subject: req.body.shortname
                                };
                                mdlCon.UpdateArray({$push:{subjects:object}}, res, query)
                                .then(result => {
                                    if(!result) {
                                        return res.status(404).send({
                                            good: false,
                                            message: 'No class was found!'
                                        });
                                    }
                                    else {
                                        return res.status(200).send({
                                            good: true,
                                            data: result
                                        });
                                    }
                                })
                            }
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
        var query = {name: req.params.identification, facility: req.user.facility};
        if(req.user.accountType === 'Administrator'){
            query = {name: req.params.identification};
        }
        mdlCon.findOne(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No class found!'
                });
            }
            let query2 = query;
            query2.subjects = {$elemMatch: {subject: req.body.shortname, profesor: req.body.username}};
            mdlCon.findOne(res, query2, {subjects: 1})
            .then(result => {
                if(!result) {
                    return res.status(400).send({
                        good: false,
                        message: 'That teacher doesn\'t teach that subject in this class!'
                    });
                }
                var object = {
                    profesor: req.body.username,
                    subject: req.body.shortname
                };
                mdlCon.UpdateArray({$pop:{subjects:object}}, res, query)
                .then(result => {
                    if(!result) {
                        return res.status(404).send({
                            good: false,
                            message: 'No class was found!'
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
    });

router.get('/:identification/subjects/preput', (req, res) => {
    if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission for that!'
        });
    }
    var query = {accountType: 'Profesor'};
    if(req.user.accountType === 'Moderator') {
        query.facility = req.user.facility;
    }
    UmdlCon.find(res, query, projection)
    .then(result => {
        if(!result || result.length === 0) {
            return res.status(404).send({
                good: false,
                message: 'There\'s no profesors you can add!'
            });
        }
        result = result.map(a => a.username);
        SmdlCon.find(res, {profesors: {$in: result}}, projection)
        .then(result1 => {
            if(!result1) {
                return res.status(404).send({
                    good: false,
                    message: 'Didn\'t find any subjects for your profesors!'
                });
            }
            else {
                var subjectlist = [];
                var subjectprofesor = [];
                var profesorlist = [];
                var profesorsubject = [];
                result1.forEach(elem => {
                    elem.profesors.forEach(elem1 => {
                        if(!profesorlist.includes(elem1)) {
                            profesorlist.push(elem1);
                            profesorsubject.push({
                                profesor: elem1,
                                subjects: [elem.shortname]
                            });
                        }
                        else {
                            let index = profesorlist.indexOf(elem1);
                            profesorsubject[index].subjects.push(elem.shortname);
                        }
                    });
                    subjectlist.push(elem.shortname);
                    subjectprofesor.push({
                        subject: elem.shortname,
                        profesors: elem.profesors
                    });
                });
                mdlCon.findOne(res, {name: req.params.identification}, {subjects:1})
                .then(result => {
                    if(!result) {
                        return res.status(404).send({
                            good: false,
                            message: 'Didn\'t find the class you are looking for!'
                        });
                    }
                    if(result.facility !== req.user.facility && req.user.accountType === 'Moderator') {
                        return res.status(400).send({
                            good: false,
                            message: 'You can\'t edit a class that is not part of your facility!'
                        });
                    }
                    result.subjects.forEach(element => {
                        if(subjectlist.includes(element.subject)) {
                            let index = subjectlist.indexOf(element.subject);
                            if(subjectprofesor[index].profesors.includes(element.profesor)) {
                                subjectprofesor[index].profesors.splice(subjectprofesor[index].profesors.indexOf(element.profesor), 1);
                                if(subjectprofesor[index].profesors.length === 0) {
                                    subjectprofesor.splice(index, 1);
                                    subjectlist.splice(index, 1);
                                }
                            }
                        }
                        if(profesorlist.includes(element.profesor)) {
                            let index = profesorlist.indexOf(element.profesor);
                            if(profesorsubject[index].subjects.includes(element.subject)) {
                                profesorsubject[index].subjects.splice(profesorsubject[index].subjects.indexOf(element.subject), 1);
                                if(profesorsubject[index].subjects.length === 0) {
                                    profesorsubject.splice(index, 1);
                                    profesorlist.splice(index, 1);
                                }
                            }
                        }
                    });
                    if(profesorsubject.length === 0 || subjectprofesor === 0) {
                        return res.status(404).send({
                            good: false,
                            message: 'No profesors/subjects to add!'
                        });
                    }
                    return res.status(200).send({
                        good: true,
                        data: {
                            choices: {
                                profesorsubject,
                                subjectprofesor
                            }
                        }
                    });
                });
            }
        });
    });
});

router.get('/:identification/subjects/predelete', (req, res) => {
    if(req.user.accountType !== 'Administrator' && req.user.accountType !== 'Moderator') {
        return res.status(403).send({
            good: false,
            message: 'You don\'t have permission for that!'
        });
    }
    mdlCon.findOne(res, {name: req.params.identification}, {subjects:1})
    .then(result => {
        if(!result) {
            return res.status(404).send({
                good: false,
                message: 'Didn\'t find the class you are looking for!'
            });
        }
        if(result.facility !== req.user.facility && req.user.accountType === 'Moderator') {
            return res.status(400).send({
                good: false,
                message: 'You can\'t edit a class that is not part of your facility!'
            });
        }
        var subjectprofesor = [];
        var profesorlist = [];
        var profesorsubject = [];
        result.subjects.forEach(elem => {
            if(!profesorlist.includes(elem.profesor)) {
                profesorlist.push(elem.profesor);
                profesorsubject.push({
                    profesor: elem.profesor,
                    subjects: []
                });
            }
            subjectprofesor.push({
                subject: elem.subject,
                profesors: [elem.profesor]
            });
        });
        result.subjects.forEach(elem => {
            var index = profesorlist.indexOf(elem.profesor);
            profesorsubject[index].subjects.push(elem.subject);
        });
        if(profesorsubject.length === 0 || subjectprofesor.length === 0) {
            return res.status(404).send({
                good: false,
                message: 'No subjects/profesors to delete!'
            });
        }
        return res.status(200).send({
            good: true,
            data: {
                choices: {
                    subjectprofesor,
                    profesorsubject
                }
            }
        });
    });
});

module.exports = router;