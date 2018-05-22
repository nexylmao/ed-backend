const Methods = require('../_methods/methods');
const SchoolYear = require('../_models/schoolYearsModel');
const ModelController = require('../_prototypes/modelFunctions');
const mdlCon = new ModelController(SchoolYear, Methods.data());

module.exports = (req, res, next) => {
    // analyzes if there's something in school-year header, and if there is, changes the default
    // dbName to the appropriate one for the school year
    var query = {yearRange: Methods.currentYearRange()};
    if(req.headers['x-school-year']) {
        query.yearRange = req.headers['x-school-year'];
    }
    mdlCon.findOne(res, query)
    .then(result => {
        if(!result) {
            return res.status(400).send({
                good: false,
                message: 'The School Year you are demanding does not exist!'
            });
        }
        else {
            req.dbName = Methods.getDatabaseName(result.yearRange);
            req.dbActive = result.active;
            if(req.method !== 'GET' && result.active === false) {
                return res.status(400).send({
                    good: false,
                    message: 'You can\'t edit anything in the school year that\'s not active!'
                });
            }
            next();
        }
    });
}