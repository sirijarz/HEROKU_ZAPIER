const { v4: uuidv4 } = require('uuid');

const  {zapierUser}  = require('../Entities/Zapier');
// Create and Save a new User with api key


var createApikey = function(zapierDAO, zapierEntity){
return function(email){
    return new Promise(function(resolve,reject) {
      const user = zapierUser({email: email, api_key: uuidv4()});
      zapierDAO.createApikey(user).then(function (response){
         if(response.status == true){
              resolve(user)
    } 
})
})
}
}

var getZapierUser = function(zapierDAO, zapierEntity){
    return function(email,api_key){
        return new Promise(function(resolve,reject){
            zapierDAO.getZapierUser(email,api_key).then(function(response){
                if(response.status == true){
                    resolve(response)
                }
            })
        })
    }
}
// Google Drive and One drive
var printData = function(zapierDAO, zapierEntity){
    return function(email,updateObj){
        return new Promise(function(resolve,reject){
            
            zapierDAO.printData(email,updateObj).then(function(response){
                if(response.status == true){
                    resolve(response)
                }
            })
        })
    }
}


module.exports = {
    createApikey,
    getZapierUser,
    printData
}