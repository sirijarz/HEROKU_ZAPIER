var {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
var mongo = require("../utilities/dbConnections");
var encryption = require("../utilities/encryptionUtilities");
var request = require("request");
const googleConfig = {
    clientId: '307378174190-dlpkb9hp2pqc3i8iv2abttvhhje1or42.apps.googleusercontent.com', // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
    clientSecret: 'J-JF8ylHSzqECXqeXHfzuhh_', // e.g. _ASDFA%DFASDFASDFASD#FAD-
    redirect: 'https://cloud.marsview.ai/media/integration', // this must match your google api settings
};

const defaultScope = [
    'https://www.googleapis.com/auth/youtube.readonly',
  ];



 var createConnection = function() {
    return new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirect
    );
  }

  var getConnectionUrl = function(auth) {
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
      scope: defaultScope
    });
  }
  
  var getYoutubeAuthorizationUrl = function() {
    let responseObj = {};
    var urlPromise = new Promise((resolve,reject) => {

        const auth = createConnection(); // this is from previous step
        const url = getConnectionUrl(auth);
        
        if(url !== null) {
            responseObj.status = true;
            responseObj.data = url
            resolve(responseObj)
        } else {
            responseObj.status = false;
            responseObj.msg = "Error getting authorization url";
            responseObj.err = error;
            resolve(responseObj)
        }
    });
    return urlPromise;
  }

  var getTokensFromCode = function(code) {
    // const auth = createConnection();
    let responseObj = {};
    var urlCodePromise = new Promise((resolve, reject) => {
        const oauth2Client = new OAuth2Client(
            googleConfig.clientId,
            googleConfig.clientSecret,
            googleConfig.redirect
          );
    
          try {
            const r = oauth2Client.getToken(code);
            r.then((value) => {
                responseObj.status = true;
                responseObj.data = {};
                responseObj.data.access_token = value.tokens.access_token
                responseObj.data.refresh_token = value.tokens.refresh_token

                oauth2Client.setCredentials(r.tokens);
                resolve(responseObj);
               
            });
            
          } catch(e) {
            responseObj.status = false;
            responseObj.msg = "Error getting tokens for the user";
            responseObj.err = error;
          resolve(responseObj)
          }
    })
    return urlCodePromise;
  }

  var refreshTheToken = function(refreshToken, accesstoken, userId) {
    var db = mongo.getDB();
    var resolveObj = {};
    var checkTokenInfoPromise = new Promise((resolve, reject) => {
      const oauth2Client = new OAuth2Client(
          googleConfig.clientId,
          googleConfig.clientSecret,
          googleConfig.redirect
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        let isExpired = oauth2Client.isTokenExpiring();
        
        if(!isExpired) {
          oauth2Client.refreshAccessToken((err, creds) => {
            // console.log("TTTTTTTTTT", creds)
            
              let youtube = {};
              
              youtube.client_secret = encryption.encrypt(creds.access_token);
                   if(creds.access_token != undefined){
                        db.collection("integration_creds").update(
                          { user_id: userId },
                          { $set: { 'youtube.client_secret' : youtube.client_secret , updated_time: new Date() } },
                          { upsert: false },
                          function(err, result) {
                            if (err) {
                              resolveObj.status = false;
                              resolveObj.access_token = err;
                              resolve(resolveObj);
                            } else {
                              resolveObj.status = true;
                              resolveObj.access_token = creds.access_token;
                              resolve(resolveObj);
                            }
                          }
                        );
                   }
          });
          
        } else {
          resolveObj.status = true;
          resolveObj.access_token = accesstoken;
          resolve(resolveObj);
        }

        
  })
  return checkTokenInfoPromise;

  }

  var userDetails = function(token) {
    var userDetailsPromise = new Promise((resolve, reject) => {
      
      var bcURL = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`;

    let responseObj = {};
      
      request.get(
          {
            url: bcURL
          },
          (error, response, result) => {
            console.log(bcURL)
            if (error) {
              responseObj.status = false;
              responseObj.msg = "Error getting videos for the user";
              responseObj.err = error;
            resolve(responseObj)
            } else {
              // console.log(result);
              userData = JSON.parse(result);
              if(userData.length > 0){
                  // console.log(userData[0])
                  if(userData[0].error_code != undefined){
                      responseObj.status = false;
                      responseObj.msg = userData[0].message;
                      resolve(responseObj)
                    
                  }else{
                      responseObj.status = true;
                      responseObj.data = userData
                      resolve(responseObj)
                  }
              }else{
                  responseObj.status = true;
                  responseObj.data = userData
                resolve(responseObj)
              }
            }
          }
        );
    });
    return userDetailsPromise;
  }

  module.exports = {
    getYoutubeAuthorizationUrl:getYoutubeAuthorizationUrl,
    getTokensFromCode: getTokensFromCode,
    refreshTheToken: refreshTheToken,
    userDetails: userDetails
  }