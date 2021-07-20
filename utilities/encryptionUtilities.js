var crypto = require('crypto')
var express = require('express');
const bcrypt = require('bcrypt');

var encrypt = function(rawString){
    var privateKey = crypto.createCipher('aes-128-gcm','admin!@#$%')
    var encryptData = privateKey.update(rawString,'utf8','hex');
    encryptData += privateKey.final('hex');
    var authTag = privateKey.getAuthTag();
    return {encryptData:encryptData,tag:authTag}; 
}

var decrypt = function(encodedString,authTag){
    var privateKey = crypto.createDecipher('aes-128-gcm','admin!@#$%')
    // console.log(authTag)
    privateKey.setAuthTag(authTag.buffer)
    var decryptData = privateKey.update(encodedString,'hex','utf8');
    // console.log(decryptData)    
    decryptData += privateKey.final('utf8')
    return decryptData
}

var hashPassword = function(password){
    // console.log(password)
    const saltRounds = 10;

    return bcrypt.hash(password,saltRounds);
    // var salt = bcrypt.genSaltSync(saltRounds);
    // var hash = bcrypt.hashSync(password,salt);
    // return hash
    // bcrypt.genSalt(saltRounds,function(err,salt){
       
    //     bcrypt.hash(password,salt,function(err,hash){
    //         console.log(hash);
    //         comparePassword("password",hash)
    //         return hash;
    //     })
    // })

}

var comparePassword = function(password,hash){
    // console.log(password+" "+hash)
    return bcrypt.compare(password,hash);
    // bcrypt.compare(password,hash,function(err,result){
    //     console.log(result)
    //     return result;
    // })
}

module.exports = {
    encrypt : encrypt,
    decrypt : decrypt,
    hashPassword : hashPassword,
    comparePassword : comparePassword
}