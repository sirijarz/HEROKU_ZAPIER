var request = require('request');
const mongo  = require('./dbConnections');
var encryption = require('./encryptionUtilities');
var Config = require("../config/config")
var conf = new Config();

var zoomCredentials = {
  clientId: conf.zoomClientId,
  clientSecret: conf.zoomClientSecret,
  zoomRedirectUrl: conf.zoomRedirectUrl
};

var getZoomUserDetails =  function(accessToken) {
  
  let userDetails = {};
  var userDetailsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.zoom.us/v2/users/me`;

  let responseObj = {};

  request.get(
      {
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer " + accessToken
        },
        url: bcURL
      },
      (error, response, result) => {

        // console.log(bcURL)
        if (error) {
          responseObj.status = false;
          responseObj.msg = "Error getting user details";
          responseObj.err = error;
          resolve(responseObj);
          
        } else {
          // console.log(result);

          userDetails = JSON.parse(result);
          // console.log(userData, "USERDATA")
          if(userDetails != ''){

            responseObj.status = true;
            responseObj.data = userDetails;
            
            resolve(responseObj);
          }else{
              responseObj.status = false;
              responseObj.data = userDetails;
            resolve(responseObj)
          }
        }
      }
    );
  });

return userDetailsPromise;
}


var saveZoomUserDetails =  function(accessToken, userId) {
    var db = mongo.getDB();
    let userDetails = {};
    var userDetailsPromise = new Promise((resolve,reject) => {
     
    var bcURL = `https://api.zoom.us/v2/users/me`;

    let responseObj = {};

    request.get(
        {
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer " + accessToken
          },
          url: bcURL
        },
        (error, response, result) => {

          // console.log(bcURL)
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error getting user details";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            // console.log(result);

            userDetails = JSON.parse(result);
            // console.log(userData, "USERDATA")
            if(userDetails != ''){
                db.collection("integration_creds").update(
                    { user_id: userId },
                    { $set: { 'zoom.userDetails': userDetails, updated_time: new Date() } },
                    { upsert: true },
                    function(err, result) {
                      if (err) {
                        responseObj.status = false;
                        responseObj.msg = "Error saving data";
                        responseObj.err = err;
                        resolve(responseObj);
                      } else {
                        responseObj.status = true;
                        responseObj.data = result;
                        responseObj.userDetails = userDetails
                        resolve(responseObj);
                      }
                    }
                  );
            }else{
                responseObj.status = false;
                responseObj.data = userDetails;
              //   return  responseObj;
              resolve(responseObj)
            }
          //   res.send(responseObj);
          }
        }
      );
    });

  return userDetailsPromise;
}

var getZoomRecordings =  function(accessToken, refreshToken, expiresIn, userId, zoomId, nextPageToken,fromDate,toDate) {
    
    var recordingsPromise = new Promise((resolve,reject) => {
    var fromDateZoom = '';
    var toDateZoom = '';
    
    if(fromDate){
      var dateZoom = new Date(fromDate)
      fromDateZoom = dateZoom.toISOString().substr(0,10);
      // console.log(dateZoom.)
    }else{
      fromDateZoom = '1970-01-01'
    }
    // console.log(toDate)
    if(toDate){
      var dateZoom = new Date(toDate);
      toDateZoom = dateZoom.toISOString().substr(0,10);
    }else{
      toDateZoom = ''
    }

    console.log(fromDateZoom)
    var bcURL = `https://api.zoom.us/v2/users/${zoomId}/recordings?from=`+fromDateZoom+`&to=`+toDateZoom+`&next_page_token=${nextPageToken}`;
    // var bcURL = `https://api.zoom.us/v2/users/${zoomId}/recordings?f`;

    let responseObj = {};
    console.log(bcURL);
    

    refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
        if (result.status === true) {
          // console.log(result.accessToken)
            request.get(
                {
                  headers: {
                    "content-type": "application/json",
                    Authorization: "Bearer " + result.accessToken
                  },
                  url: bcURL
                },
                (error, response, body) => {
                  let result = JSON.parse(body);
                  // console.log(error,response,body)
                  // console.log(bcURL)
                  if (error) {
                    responseObj.status = false;
                    responseObj.msg = "Error getting recordings";
                    responseObj.err = err;
                    resolve(responseObj);
                  } else if(result.meetings != undefined) {
                    responseObj.status = true;
                    responseObj.data = result;
                    resolve(responseObj);
                  }else{
                    responseObj.status = false  ;
                    responseObj.data = result;
                    resolve(responseObj);
                  }
                }
              );
        } else {
            resolve(result);
        }
    })
    });

  return recordingsPromise;
}

var getRecordingDetails =  function(accessToken, refreshToken, expiresIn, userId, meetingId) {
    
  var recordingsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;

  let responseObj = {};

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
      if (result.status === true) {
          request.get(
              {
                headers: {
                  "content-type": "application/json",
                  Authorization: "Bearer " + result.accessToken
                },
                url: bcURL
              },
              (error, response, body) => {
                let result = JSON.parse(body);
      
                // console.log(bcURL)
                if (error) {
                  responseObj.status = false;
                  responseObj.msg = "Error getting recordings";
                  responseObj.err = err;
                  resolve(responseObj);
                } else {
                  responseObj.status = true;
                  responseObj.data = result;
                  resolve(responseObj);
                }
              }
            );
      } else {
        responseObj.status = false;
        responseObj.err = result
          resolve(responseObj);
      }
  })
  });

return recordingsPromise;
}

var getUserSettings =  function(accessToken, refreshToken, expiresIn, userId, meetingId) {
    
  var recordingsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.zoom.us/v2//users/me/settings`;

  let responseObj = {};

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
      if (result.status === true) {
          request.get(
              {
                headers: {
                  "content-type": "application/json",
                  Authorization: "Bearer " + result.accessToken
                },
                url: bcURL
              },
              (error, response, body) => {
                let result = JSON.parse(body);
      
                // console.log(bcURL)
                if (error) {
                  responseObj.status = false;
                  responseObj.msg = "Error getting recordings";
                  responseObj.err = err;
                  resolve(responseObj);
                } else {
                  responseObj.status = true;
                  responseObj.data = result;
                  resolve(responseObj);
                }
              }
            );
      } else {
        responseObj.status = false;
        responseObj.err = result
          resolve(responseObj);
      }
  })
  });

return recordingsPromise;
}

var getRecordingSettings =  function(accessToken, refreshToken, expiresIn, userId, meetingId) {
    
  var recordingsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.zoom.us/v2/meetings/${meetingId}/recordings/settings`;

  let responseObj = {};

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
      if (result.status === true) {
          request.get(
              {
                headers: {
                  "content-type": "application/json",
                  Authorization: "Bearer " + result.accessToken
                },
                url: bcURL
              },
              (error, response, body) => {
                let result = JSON.parse(body);
      
                console.log(bcURL)
                if (error) {
                  responseObj.status = false;
                  responseObj.msg = "Error getting recordings";
                  responseObj.err = err;
                  resolve(responseObj);
                } else {
                  responseObj.status = true;
                  responseObj.data = result;
                  resolve(responseObj);
                }
              }
            );
      } else {
          resolve(result);
      }
  })
  });

return recordingsPromise;
}

var getUserMeetings =  function(accessToken, refreshToken, expiresIn, userId,zoomId,type) {
    
  var meetingPromise = new Promise((resolve,reject) => {
   
  // var bcURL = `https://api.zoom.us/v2/meetings/${meetingId}/recordings/settings`;
  var bcURL = `https://api.zoom.us/v2/users/${zoomId}/meetings?type=`+type;

  let responseObj = {};

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
      if (result.status === true) {
          request.get(
              {
                headers: {
                  "content-type": "application/json",
                  Authorization: "Bearer " + result.accessToken
                },
                url: bcURL
              },
              (error, response, body) => {
                let result = JSON.parse(body);
      
                console.log(bcURL)
                if (error) {
                  responseObj.status = false;
                  responseObj.msg = "Error getting recordings";
                  responseObj.err = err;
                  resolve(responseObj);
                } else {
                  responseObj.status = true;
                  responseObj.data = result;
                  resolve(responseObj);
                }
              }
            );
      } else {
          resolve(result);
      }
  })
  });

return meetingPromise;
}


var refreshTokens = function(accessToken, refreshToken, expiresIn, userId) {
    var db = mongo.getDB();
    var refreshTokenPromise = new Promise((resolve,reject) => {
    
    let responseObj = {};
    let clientId = conf.zoomClientId;
    let clientSecret = conf.zoomClientSecret;

    var now = new Date();
    var expires = new Date(expiresIn);
    // Check if accessToken is expired or not 
    
    if(now < expires) {
        console.log("Not Expired");
        responseObj.status = true;
        responseObj.accessToken = accessToken;
        resolve(responseObj);
    } else {
        console.log("Expired");
        var options = {
            method: 'POST',
            url: 'https://zoom.us/oauth/token?grant_type=refresh_token&refresh_token=' + refreshToken,
            headers: {
              /**The credential below is a sample base64 encoded credential. Replace it with "Authorization: 'Basic ' + Buffer.from(your_app_client_id + ':' + your_app_client_secret).toString('base64')"
              **/
             Authorization: 'Basic ' + Buffer.from(zoomCredentials.clientId + ':' + zoomCredentials.clientSecret).toString('base64')
            }
        };
        // console.log(refreshToken);
        request(options, function (error, response, body) {
          if(!error){
            const json = JSON.parse(body);
            // console.log(json);
            if(!json.error) {
                 // Check payload
                 let zoom = {};
                 var now = new Date();
          
                 let expiryDate = new Date(now.getTime() + json.expires_in*1000);
                        
                 zoom.accessToken = encryption.encrypt(json.access_token);
                 zoom.refreshToken = encryption.encrypt(json.refresh_token);
                 zoom.expiresIn = expiryDate;
                 db.collection("integration_creds").update(
                  { user_id: userId },
                  { $set: { 'zoom.accessToken' : zoom.accessToken , 'zoom.refreshToken': zoom.refreshToken, 'zoom.expiresIn': zoom.expiresIn, updated_time: new Date() } },
                  { upsert: false },
                  function(err, result) {
                    if (err) {
                      responseObj.status = false;
                      responseObj.msg = "Error updating database with new refresh token"
                      responseObj.err = err
                      resolve(responseObj);
                      console.log(responseObj)
                    } else {
                      responseObj.status = true;
                      responseObj.accessToken = json.access_token;
                      resolve(responseObj);
                    }
                  }
                );
            } else {
              responseObj.status = false;
              responseObj.msg = json
              resolve(responseObj);
            }
          }else{
            responseObj.status = false;
            responseObj.msg = error;
            resolve(responseObj)
          }
            // console.log(options)
          
    
        });
    }

    
  });

  return refreshTokenPromise;
}

var dataCompliance =  function(deauthorizeObject) {
    
  var compliancePromise = new Promise((resolve,reject) => {
   
  let responseObj = {};

  let requestObject = {
    client_id: zoomCredentials.clientId,
    user_id: deauthorizeObject.payload.user_id,
    account_id: deauthorizeObject.payload.account_id,
    deauthorization_event_received: {
      user_data_retention: "false",
      account_id: deauthorizeObject.payload.account_id,
      user_id: deauthorizeObject.payload.user_id,
      signature: deauthorizeObject.payload.signature,
      deauthorization_time: deauthorizeObject.payload.deauthorization_time,
      client_id: zoomCredentials.clientId
    },
    compliance_completed: true
  }

  var options = {
    method: 'POST',
    url: `https://api.zoom.us/oauth/data/compliance`,
    headers: {
     Authorization: 'Basic ' + Buffer.from(zoomCredentials.clientId + ':' + zoomCredentials.clientSecret).toString('base64')
    },
    body: requestObject,
    json:true
  };

  request(options, function (error, response, body) {
           
    // console.log(json);
    if(!error) {
      console.log(body)
      // const json = JSON.parse(body);
      responseObj.status = true;
      responseObj.data = body
      resolve(responseObj);
    } else {
      console.error(error)
      responseObj.status = false;
      resolve(responseObj);
    }
  });

  });


  return compliancePromise;
}

var deleteZoomRecordings = function(filenames,username){
  var db = mongo.getDB();
  responseObj = {};
  fileNames = [];

  return new Promise((resolve,reject)=>{
    if( filenames != null || filenames != undefined || filenames instanceof Array){
      fileNames = filenames
    }
    console.log(fileNames)
  
    db.collection("mv_sm_audio_customtags").deleteMany(
      { file_name: {$in:fileNames} },
      function(err, result) {
        db.collection("mv_sm_audio_events").deleteMany(
          { file_name: {$in:fileNames} },
          function(err, result) {
            db.collection("mv_sm_audio_keywords").deleteMany(
              { file_name: {$in:fileNames} },
              function(err, result) {
                db.collection("mv_sm_audio_misc").deleteMany(
                  { file_name: {$in:fileNames} },
                  function(err, result) {
                    db.collection("mv_sm_audio_person").deleteMany(
                      { file_name: {$in:fileNames} },
                      function(err, result) {
                        db.collection("mv_sm_audio_places").deleteMany(
                          { file_name: {$in:fileNames} },
                          function(err, result) {
                            db.collection("mv_sm_audio_sentence").deleteMany(
                              { file_name: {$in:fileNames} },
                              function(err, result) {
                                db.collection("mv_sm_screengrabs").deleteMany(
                                  { file_name: {$in:fileNames} },
                                  function(err, result) {
                                    db.collection("mv_sm_toc").deleteMany(
                                      { file_name: {$in:fileNames} },
                                      function(err, result) {
                                        db.collection("mv_sm_video_customtags").deleteMany(
                                          { file_name: {$in:fileNames} },
                                          function(err, result) {
                                            db.collection("mv_sm_video_events").deleteMany(
                                              { file_name: {$in:fileNames} },
                                              function(err, result) {
                                                db.collection("mv_sm_video_faces").deleteMany(
                                                  { file_name: {$in:fileNames} },
                                                  function(err, result) {
                                                    db.collection("mv_sm_video_keywords").deleteMany(
                                                      { file_name: {$in:fileNames} },
                                                      function(err, result) {
                                                        db.collection("mv_sm_video_labels").deleteMany(
                                                          { file_name: {$in:fileNames} },
                                                          function(err, result) {
                                                            db.collection("mv_sm_video_misc").deleteMany(
                                                              { file_name: {$in:fileNames} },
                                                              function(err, result) {
                                                                db.collection("mv_sm_video_places").deleteMany(
                                                                  { file_name: {$in:fileNames} },
                                                                  function(err, result) {
                                                                    db.collection("mv_sm_zoom_meetings").deleteMany({user_id:username},function(err,result){

                                                                    
                                                                    db.collection("file_info").deleteMany(
                                                                      { file_name: {$in:fileNames},$or: [{ userId: username },{ 'user_id' : username }] },
                                                                      function(err, result) {
                                                                        if (err) {
                                                                          console.log(err)
                                                                          responseObj.status = false;
                                                                          responseObj.msg = "Error deleting videos";
                                                                          resolve(responseObj);
                                                                        } else {
                                                                          var searchRequest = {}
                                                                          searchRequest.files = fileNames;
                                                                          searchRequest.userId = username;
                                                                      
                                                                      request.put(conf.searchCreateUrl+'/v2/search/deleteFilesIndex',{json:searchRequest},function(error,searchResponse,body){
                                                                          if(error){
                                                                              console.error(error)
                                                                              // resolve(responseObj);
                                                                          }else{
                                                                              if(searchResponse.statusCode == 200){
                                                                                  console.log("delete file index successfull",body)
                                                                              }
                                                                              console.log(body)
                                                                              // resolve(responseObj);
                                                                          }
                                                                      })
                                                                          responseObj.status = true;
                                                                          responseObj.msg = "Video Deleted Successfully";
                                                                          responseObj.data = result
                                                                          // console.log(result)
                                                                          resolve(responseObj);
                                                                        }
                                                                      }
                                                                    );
                                                                  });
                                                                });
                                                              });
                                                          });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  })


}

var updateLiveStream = function(accessToken,refreshToken,expiresIn,userId,meetingId,updateObject){
  var recordingsPromise = new Promise((resolve,reject) => {
   
    var bcURL = `https://api.zoom.us/v2/meetings/${meetingId}/livestream`;
  
    let responseObj = {};
    console.log("update stream Meeting:",meetingId)
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
        if (result.status === true) {

          var options = {
            method: 'PATCH',
            url: bcURL,
            headers: {
             Authorization: 'Bearer ' + result.accessToken
            },
            body: updateObject,
            json:true
          };
          request(options, function (error, response, body) {
            console.log("Update Stream error",meetingId,error);
            console.log("Update Stream response",meetingId,response.statusCode);
            console.log("Update Stream body",meetingId,body)
            console.log(error);
            if(!error) {
              // console.log(body)
              // const json = JSON.parse(body);
              if(response.statusCode == 204){
                responseObj.status = true;
                responseObj.data = response.statusCode
                responseObj.response = response
                resolve(responseObj);
              }else{
                responseObj.status = false;
                responseObj.data = body
                resolve(responseObj)
              }
              
            } else {
              console.error(error)
              responseObj.status = false;
              resolve(responseObj);
            }
          });
        } else {
            resolve(result);
        }
    })
    });

    return recordingsPromise;
}

var updateLiveStreamStatus = function(accessToken,refreshToken,expiresIn,userId,meetingId,updateObject){
  var recordingsPromise = new Promise((resolve,reject) => {
   
    var bcURL = `https://api.zoom.us/v2/meetings/${meetingId}/livestream/status`;
  
    let responseObj = {};
    console.log("Automate stream Meeting:",meetingId)
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
        if (result.status === true) {

          var options = {
            method: 'PATCH',
            url: bcURL,
            headers: {
             Authorization: 'Bearer ' + result.accessToken
            },
            body: updateObject,
            json:true
          };
          request(options, function (error, response, body) {
           
            console.log("Automate Stream error",meetingId,error);
            console.log("Automate Stream response",meetingId,response.statusCode);
            console.log("Automate Stream body",meetingId,body)
            if(!error) {
              console.log(body)
              // const json = JSON.parse(body);
              if(response.statusCode == 204){
                responseObj.status = true;
                responseObj.data = response.statusCode
                responseObj.response = response
                resolve(responseObj);
              }else{
                responseObj.status = false;
                responseObj.data = body
                resolve(responseObj)
              }
            } else {
              console.error(error)
              responseObj.status = false;
              resolve(responseObj);
            }
          });
        } else {
            resolve(result);
        }
    })
    });

    return recordingsPromise;
}

var getMeetingParticipants = function(accessToken,refreshToken,expiresIn,userId,meetingUUID){
  var recordingsPromise = new Promise((resolve,reject) => {
   
    var bcURL = `https://api.zoom.us/v2/past_meetings/${meetingUUID}/participants`;
  
    let responseObj = {};
  
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
        if (result.status === true) {
            request.get(
                {
                  headers: {
                    "content-type": "application/json",
                    Authorization: "Bearer " + result.accessToken
                  },
                  url: bcURL
                },
                (error, response, body) => {
                  let result = JSON.parse(body);
        
                  // console.log(bcURL)
                  if (error) {
                    responseObj.status = false;
                    responseObj.msg = "Error getting participants";
                    responseObj.err = err;
                    resolve(responseObj);
                  } else {
                    responseObj.status = true;
                    responseObj.data = result;
                    resolve(responseObj);
                  }
                }
              );
        } else {
          responseObj.status = false;
          responseObj.err = result
            resolve(responseObj);
        }
    })
    });

    return recordingsPromise
  
}

var getMeetingDetails =  function(accessToken, refreshToken, expiresIn, userId, meetingId) {
    
  var meetingPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.zoom.us/v2/meetings/${meetingId}`;

  let responseObj = {};

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {
      if (result.status === true) {
          request.get(
              {
                headers: {
                  "content-type": "application/json",
                  Authorization: "Bearer " + result.accessToken
                },
                url: bcURL
              },
              (error, response, body) => {
                let result = JSON.parse(body);
      
                console.log(bcURL)
                if (error) {
                  responseObj.status = false;
                  responseObj.msg = "Error getting recordings";
                  responseObj.err = err;
                  resolve(responseObj);
                } else {
                  responseObj.status = true;
                  responseObj.data = result;
                  resolve(responseObj);
                }
              }
            );
      } else {
          resolve(result);
      }
  })
  });

return meetingPromise;
}

module.exports = {
    saveZoomUserDetails:saveZoomUserDetails,
    getZoomRecordings: getZoomRecordings,
    getRecordingDetails: getRecordingDetails,
    refreshTokens: refreshTokens,
    dataCompliance: dataCompliance,
    getRecordingSettings:getRecordingSettings,
    deleteZoomRecordings:deleteZoomRecordings,
    getUserMeetings:getUserMeetings,
    updateLiveStream:updateLiveStream,
    updateLiveStreamStatus:updateLiveStreamStatus,
    getMeetingParticipants:getMeetingParticipants,
    getZoomUserDetails:getZoomUserDetails,
    getMeetingDetails:getMeetingDetails  ,
    getUserSettings:getUserSettings 
  }


