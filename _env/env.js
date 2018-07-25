module.exports = {
    PORT: process.env.PORT || 1337,
    MONGODBPATH: process.env.MONGODBPATH || "mongodb://localhost:27017",
    ALLOWREGISTER: process.env.ALLOWREGISTER || 'nope',
    SECRET: process.env.SECRET || 'random keyword',
    NODE_ENV: process.env.NODE_ENV || 'node_env'
}