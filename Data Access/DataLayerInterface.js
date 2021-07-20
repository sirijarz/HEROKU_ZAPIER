var express = require("express");

var dbConnection = require('../utilities/dbConnections');
var dataAccess = require('./DataAccessLayer.js')

var createApikey = dataAccess.createApikey(dbConnection);
var getZapierUser = dataAccess.getZapierUser(dbConnection);
var printData = dataAccess.printData(dbConnection);

module.exports = {
    createApikey: createApikey,
    getZapierUser: getZapierUser,
    printData: printData
}