const router = require('express').Router();

const Grades = require('../_models/gradeModel');
const ModelController = require('../_prototypes/modelFunctions');
const Methods = require('../_methods/methods');
const mdlCon = new ModelController(Grades, Methods.getDatabaseName(Methods.currentYearRange()));
const projection = {_id:0, updatedAt:0, __v:0};

router.route('/')
    .get((req, res) => {
        mdlCon.setDBName(req.dbName);
        var query = {givenTo: req.user.username};
        if(req.user.accountType === 'Profesor') {
            query = {givenBy: req.user.username};
        }
        mdlCon.find(res, query, projection)
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'No grades found!'
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
        if(req.user.accountType === 'Profesor' || req.user.accountType === 'Administrator') {
            if(req.user.accountType === 'Profesor') {
                if(req.user.facility !== req.class.facility) {
                    return res.status(400).send({
                        good: false,
                        message: 'You can\'t give grades in a class that is not in your facility!'
                    });
                }
                if(!req.class.students.includes(req.body.student)) {
                    return res.status(400).send({
                        good: false,
                        message: 'That student isn\'t part of this class!'
                    });
                }
                var teachingSubjects = [];
                req.class.subjects.forEach(elem => {
                    if(elem.profesor === req.user.username) {
                        teachingSubjects.push(elem.subject);
                    }
                });
                if(teachingSubjects === []) {
                    return res.status(404).send({
                        good: false,
                        message: 'You don\'t teach anything in this class!'
                    });
                }
                if(!teachingSubjects.includes(req.body.subject)) {
                    return res.status(404).send({
                        good: false,
                        message: 'You don\'t teach that subject in this class!'
                    });
                }
            }
            mdlCon.setDBName(req.dbName);
            var newGrade = {
                grade: req.body.grade,
                points: req.body.points,
                comment: req.body.comment,
                givenTo: req.body.student,
                subject: req.body.subject
            }
            if(req.user.accountType === 'Profesor') {
                newGrade.givenBy = req.user.username;
            }
            if(req.user.accountType === 'Administrator') {
                newGrade.givenBy = req.body.givenBy || req.user.username;
            }
            mdlCon.create({body: newGrade}, res)
            .then(result => {
                if(!result) {
                    return res.status(400).send({
                        good: false,
                        message: 'Something went wrong while adding the grade to the database!'
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
                good: true,
                message: 'You don\'t have the permission to do this!'
            });
        }
    });

router.get('/prepost', (req, res) => {
    if(req.user.accountType === 'Profesor') {
        var students = req.class.students;
        var teachingSubjects = [];
        req.class.subjects.forEach(elem => {
            if(elem.profesor === req.user.username) {
                teachingSubjects.push(elem.subject);
            }
        });
        if(teachingSubjects === []) {
            return res.status(404).send({
                good: false,
                message: 'You don\'t teach anything in this class!'
            });
        }
        return res.status(200).send({
            good: true,
            data: {
                choice: {
                    student: students,
                    subject: teachingSubjects
                }
            }
        });
    }
    else if(req.user.accountType === 'Administrator') {
        var students = req.class.students;
        var subjectprofesor = [];
        var profesorlist = [req.user.username];
        var profesorsubject = [{
            profesor: req.user.username,
            subjects: []
        }];
        req.class.subjects.forEach(elem => {
            if(!profesorlist.includes(elem.profesor)) {
                profesorlist.push(elem.profesor);
                profesorsubject.push({
                    profesor: elem.profesor,
                    subjects: []
                });
            }
            subjectprofesor.push({
                subject: elem.subject,
                profesors: [elem.profesor, req.user.username]
            });
        });
        req.class.subjects.forEach(elem => {
            var index = profesorlist.indexOf(elem.profesor);
            profesorsubject[0].subjects.push(elem.subject);
            profesorsubject[index].subjects.push(elem.subject);
        });
        return res.status(200).send({
            good: true,
            data: {
                choices: {
                    givenTo: students,
                    subjectGivenBy: subjectprofesor,
                    profesorGives: profesorsubject
                }
            }
        });
    }
    else {
        return res.status(403).send({
            good: true,
            message: 'You don\'t have the permission to do this!'
        });
    }
});

module.exports = router;

