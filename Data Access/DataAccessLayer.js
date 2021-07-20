const { zapierUser } = require("../Entities/Zapier");

var createApikey = function (mongoConnection){
    
    return function(zapierUser){
        var db = mongoConnection.getDB();
        
            var responseObj = {}
            var newUser = Object.assign({},zapierUser)
        return new Promise(function(resolve,reject){
            
            db.collection('mv_sm_zapier').insertOne(newUser,function(err,result){
                if(err){
                    responseObj.status = false;
                    responseObj.err = err;
                    responseObj.msg = "Error saving setting please try again later";
                    resolve(responseObj)
                }else{
                    responseObj.status = true;
                    responseObj.data = result;

                    resolve(responseObj)
                }
            })
        })
    }
}
var getZapierUser = function (mongoConnection){
    
    return function(email,api_key){
        var db = mongoConnection.getDB();
        
            var responseObj = {}
           
        return new Promise(function(resolve,reject){
            
            db.collection('mv_sm_zapier').findOne({'email': email},function(err,result){
                console.log(result)
                if(err){
                    responseObj.status = false;
                    responseObj.err = err;
                    responseObj.msg = "Errorfinding zapier user please try again later";
                    resolve(responseObj)
                }else{
                    responseObj.status = true;
                    responseObj.data = result;

                    resolve(responseObj)
                }
            })
        })
    }
}
var printData = function (mongoConnection){
    
    return function(email,updateObj){
        var db = mongoConnection.getDB();
            console.log(email)
            var responseObj = {}
        return new Promise(function(resolve,reject){
            console.log(updateObj)
            db.collection('mv_sm_zapier').update({'email': email},
            { $set: {  
              'downloadUrl': updateObj.downloadUrl,
                'userId':updateObj.userId,
                'title':updateObj.title,
               'desription':updateObj.desription,
               'dataType':updateObj.dataType,
               'duration' :updateObj.duration  
        }},function(err,result){

                if(err){
                    responseObj.status = false;
                    responseObj.err = err;
                    responseObj.msg = "Error saving setting please try again later";
                    resolve(responseObj)
                }else{
                    responseObj.status = true;
                    responseObj.data = result;

                    resolve(responseObj)
                }
            })
        })
    }
}

module.exports ={
    createApikey,
    getZapierUser,
    printData
}