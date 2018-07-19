const application = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');

const EnviromentVariables = require('./_env/env');
const ErrorHandler = require('./_prototypes/errorHandler');
const errHandler = new ErrorHandler();
const ReqUserMethod = require('./_methods/reqUser');
const SchoolYearDatabaseNameMethod = require('./_methods/schoolYearDatabaseName');
const ReqClassMethod = require('./_methods/gradeGivingClass');

application.use(cors());
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({extended: false}));

if(EnviromentVariables.NODE_ENV === 'development') {
    const morgan = require('morgan');
    application.use(morgan('dev'));
}
else {
    require('sqreen');
}

const authRouter = require('./_routers/auth');
application.use('/auth', authRouter);

application.all('*', (req, res, next) => ReqUserMethod(req, res, next));

const userRouter = require('./_routers/user');
application.use('/user', userRouter);

const facilityRouter = require('./_routers/facility');
application.use('/facility', facilityRouter);

const schoolYearRouter = require('./_routers/schoolYear');
application.use('/schoolYear', schoolYearRouter);

application.all('*', (req, res, next) => SchoolYearDatabaseNameMethod(req, res, next));

const SubjectRouter = require('./_routers/subject');
application.use('/subject', SubjectRouter);

const ClassRouter = require('./_routers/class');
application.use('/class', ClassRouter);

application.all('*', (req, res, next) => ReqClassMethod(req, res, next));

const GradeRouter = require('./_routers/grades');
application.use('/grade', GradeRouter);

application.get('*', (req, res) => {
    res.redirect('https://elektronski-dnevnik.ml');
});
application.post('*', (req, res) => {
    res.redirect('https://elektronski-dnevnik.ml');
});
application.put('*', (req, res) => {
    res.redirect('https://elektronski-dnevnik.ml');
});
application.delete('*', (req, res) => {
    res.redirect('https://elektronski-dnevnik.ml');
});

application.use((err, req, res, next) => {
    errHandler.Handle(res, 'Something unexpected happend!', err);
    next();
});

application.listen(EnviromentVariables.PORT, () => {
    console.log('Up on {port: ' + EnviromentVariables.PORT + '}');
});