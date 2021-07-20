
var zapierUser = function create({
    email,
    api_key,
     downloadUrl,
    userId,
   title,
   desription,
   dataType,
   duration
    
} = {}){
    // if(!email){
    //     throw new Error("Email is required");
    // }
    // if(!api_key){
    //     throw new Error("api key is required");
    // }
    // if(!data){
    //     throw new Error("data is required");
    // }
   

    return Object.freeze({
        email,
        api_key,
        downloadUrl,
        userId,
        title,
        desription,
       dataType,
       duration
        
        
    })
}

module.exports={
    zapierUser
}