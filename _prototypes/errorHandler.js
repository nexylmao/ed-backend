function ErrorHandler() {}
ErrorHandler.prototype.Handle = (res, message, err) => {
    return res.status(err.status || 500).send({
        good: false,
        message,
        errMessage: err.message || ''
    });
}
module.exports = ErrorHandler;