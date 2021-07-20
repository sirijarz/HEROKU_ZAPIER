var request = require("request");
var atob = require("atob");
var Config = require('../config/config');
var encryption = require('./encryptionUtilities');
var zoomUtility = require('./zoomUtilities');
var conf = new Config();
const mongo  = require('./dbConnections')

var zoomCredentials = {
  clientId: conf.zoomClientId,
  clientSecret: conf.zoomClientSecret,
  zoomRedirectUrl: conf.zoomRedirectUrl
};

var updateTrack =  function(settingsData) {
    let responseObj = {};
    var updateTrackPromise = new Promise((resolve,reject) => {
        const options = {
            url: conf.recommendationCreate+"/create_track",
            json: true,
            body: settingsData
        };
        
      request.post(
        options,
        (err, response, body) => {
            console.log(body, "HTTPCLIENT");
          if (err) {
            responseObj.status = false;
            responseObj.msg = "Error getting creating track";
            responseObj.err = err;
          
          resolve(responseObj)
          } else {
            
            if(response != undefined){
                responseObj.status = true;
                responseObj.data = response;
                resolve(responseObj)
              //   return responseObj
            }else{
                responseObj.status = false;
                responseObj.err = accessToken.error_description;
                resolve(responseObj)
              //   return responseObj
            }
            
          //   getBrightcoveUserData(accessToken.access_token, accountId);
          }
        }
      );
    })

    return updateTrackPromise;
    
  }

  var getUserDetailsFromToken = function(token, type, idToken) {
    var getUserDetailsPromise = new Promise((resolve,reject) => {

      let responseObj = {};

      if(type === 'Google') {
        var bcURL = `https://www.googleapis.com/oauth2/v3/userinfo`;
        
        request.get(
            {
              headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + token
              },
              url: bcURL
  
            },
            (error, response, result) => {
              // console.log(bcURL)
              if (error) {
                responseObj.status = false;
                responseObj.msg = "Error getting details for the user";
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
      } else if( type === 'Microsoft'){
        
          var base64Url = idToken.split('.')[1];
          var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
      
          const decodedData = JSON.parse(jsonPayload);
          let data = {};

          data.email = decodedData.preferred_username;
          data.name = decodedData.name;

          responseObj.status = true;
          responseObj.data = data
          resolve(responseObj);

      } else if(type === 'Zoom') {
        
        var options = {
            method: 'POST',
            url: 'https://api.zoom.us/oauth/token',
            qs: {
             grant_type: 'authorization_code',
             code: token,
             redirect_uri: zoomCredentials.zoomRedirectUrl
            },
            headers: {
             Authorization: 'Basic ' + Buffer.from(zoomCredentials.clientId + ':' + zoomCredentials.clientSecret).toString('base64')
            }
        };
          
        request(options, function(error, response, body) {
          let responseObj = {};
          var db = mongo.getDB();

            if (error) {

              responseObj.status = false;
              responseObj.msg = "Invalid request. Please try again later"
              responseObj.err = error;
              resolve(responseObj);

            } else {

            
                let zoom = {};
            
    
            let json = JSON.parse(body);
            if(json.access_token) {
    
            var now = new Date();
            
            let expiryDate = new Date(now.getTime() + json.expires_in*1000);
        
            zoom.accessToken = encryption.encrypt(json.access_token);
            zoom.refreshToken = encryption.encrypt(json.refresh_token);
            // console.log(encryption.decrypt(zoom.accessToken.encryptData, zoom.accessToken.tag), "Decrypting Here");
            zoom.expiresIn = expiryDate;
            zoom.automate = false;
            zoom.frequency = 0;

            zoomUtility.getZoomUserDetails(json.access_token).then((result) => {
               // Check if user is already present, if yes save the new tokens
              db.collection('authorization').find({email:result.data.email}).toArray(function(err,authResult){
                if(authResult.length !== 0) {
                  if(!json.error) {
                     // Check payload
                     let zoom = {};
                     var now = new Date();
              
                     let expiryDate = new Date(now.getTime() + json.expires_in*1000);
                            
                     zoom.accessToken = encryption.encrypt(json.access_token);
                     zoom.refreshToken = encryption.encrypt(json.refresh_token);
                     zoom.expiresIn = expiryDate;
                     db.collection("integration_creds").update(
                      { user_id: result.data.email },
                      { $set: { 'zoom.accessToken' : zoom.accessToken , 'zoom.refreshToken': zoom.refreshToken, 'zoom.expiresIn': zoom.expiresIn, updated_time: new Date() } },
                      { upsert: false },
                      function(err, result) {
                        if (err) {
                          responseObj.status = false;
                          responseObj.msg = "Error updating database with new refresh token"
                          responseObj.err = err
                          resolve(responseObj);
                          console.log(responseObj)
                        }
                      }
                    );
                  } 
                }
              })

              if(result.status == true) {
                let data = {};

                data.name = result.data.first_name;
                data.email = result.data.email;
                data.userDetails = result.data;
                data.zoom = zoom;
                data.accessToken = json.access_token;
                data.refreshToken = json.refresh_token;
                responseObj.status = true;
                responseObj.data = data
                resolve(responseObj)

              } else {
                responseObj.status = false;
                responseObj.data = result
                resolve(responseObj)
              }
               
            })

          } else {
            responseObj.status = false;
            responseObj.data = json
            resolve(responseObj)
          }
        }
        })
    
      }
  })

  return getUserDetailsPromise;

  }

  

module.exports = {
    updateTrack: updateTrack,
    getUserDetailsFromToken: getUserDetailsFromToken,
}