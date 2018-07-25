const mongooseConnection = require('./mongooseConnection');
const mngCon = new mongooseConnection();
const errorHandler = require('./errorHandler');
const errHndl = new errorHandler();

function ModelController(Model, DatabaseName) {
    this.MongooseModel = Model;
    this.MongoDatabaseName = DatabaseName;
};
ModelController.prototype.getModel = function(){
    return this.MongooseModel;
}
ModelController.prototype.setModel = function(Model){
    this.MongooseModel = Model;
}
ModelController.prototype.getDBName = function(){
    return this.MongoDatabaseName;
}
ModelController.prototype.setDBName = function(DatabaseName){
    this.MongoDatabaseName = DatabaseName;
}
ModelController.prototype.find = function(res, query, projection = {}){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.find(query, projection)
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while querying the database!', err);
            });
        })
    });
}
ModelController.prototype.findOne = function(res, query, projection = {}){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.findOne(query, projection)
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while querying the database!', err);
            });
        })
    });
}
ModelController.prototype.create = function(req, res){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.create(req.body)
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while inserting a document in the database!', err);
            });
        })
    });
}
ModelController.prototype.Update = function(req, res, query){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.update(query, req.body, {new: true})
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while updating a document in the database!', err);
            });
        })
    });
}
ModelController.prototype.UpdateOne = function(req, res, query){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.findOneAndUpdate(query, req.body, {new: true})
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while updating a document in the database!', err);
            });
        })
    });
}
ModelController.prototype.UpdateArray = function(update, res, query){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.findOneAndUpdate(query, update)
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while updating a document in the database!', err);
            });
        })
    });
}
ModelController.prototype.DeleteOne = function(res, query){
    return new Promise(resolve => {
        mngCon.Connect(res, this.MongoDatabaseName)
        .then(() => {
            this.MongooseModel.findOneAndRemove(query)
            .then(result => {
                resolve(result);
                mngCon.Disconnect();
            })
            .catch(err => {
                errHndl.Handle(res, 'Something went wrong while deleting a document in the database!', err);
            });
        })
    });
}

module.exports = ModelController;