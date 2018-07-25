const mongoose = require('mongoose');

const ErrorHandler = require('./errorHandler');
const EnviromentVariables = require('../_env/env');

function Connection() {}
Connection.prototype.Connect = (res, DatabaseName) => {
    return new Promise(resolve => {
        var option = {
            dbName: DatabaseName,
            keepAlive: 1,
            connectTimeoutMS: 30000
        };
        mongoose.connect(EnviromentVariables.MONGODBPATH, option, err => {
            if (err) {
                var errHandler = new ErrorHandler();
                errHandler.Handle(res,'Something went wrong while connecting to the database!', err);
            }
            resolve();
        });
    });
};
Connection.prototype.Disconnect = () => {
    return new Promise(resolve => {
        mongoose.disconnect();
        resolve();
    });
}

module.exports = Connection;