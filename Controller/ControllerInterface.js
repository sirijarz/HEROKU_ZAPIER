var express = require('express');
var controller = require('./zapierController');
var entity = require('../Entities/Zapier');
var dataAccess = require('../Data Access/DataLayerInterface')


const createApikey = controller.createApikey(dataAccess,entity);
const getZapierUser = controller.getZapierUser(dataAccess,entity);
const printData = controller.printData(dataAccess,entity);

const zapierController = Object.freeze({
    createApikey,
    getZapierUser,
    printData
})

module.exports = {
    zapierController:zapierController
}