const Methods = require('../_methods/methods');
const Class = require('../_models/classModel');
const ModelController = require('../_prototypes/modelFunctions');
const mdlCon = new ModelController(Class, Methods.getDatabaseName(Methods.currentYearRange()));

module.exports = (req, res, next) => {
    if(!req.headers['x-class']) {
        return res.status(400).send({
            good: false,
            message: 'You didn\'t choose a class to give a grade in!'
        });
    }
    else {
        mdlCon.findOne(res, {name: req.headers['x-class']})
        .then(result => {
            if(!result) {
                return res.status(404).send({
                    good: false,
                    message: 'Didn\'t find the class you are looking for!'
                });
            }
            else {
                req.class = result;
                next();
            }
        });
    }
}