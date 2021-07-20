var request = require("request");
var mongo = require('./dbConnections')
var Config = require('../config/config')
var atob = require("atob");
var encryption = require('./encryptionUtilities');
var conf = new Config();
const schedule = require('node-schedule');
var moment = require('moment');



// scheduling refresh subscription for every 6 hours in a day

schedule.scheduleJob('0 */1 * * *', function () {

  var db = mongo.getDB();

  db.collection("integration_creds").find({}).toArray((err, result) => {
    if (err) {

    } else {
      for (let i = 0; i < result.length; i++) {

        if (result[i].onedrive) {

          let accessToken = encryption.decrypt(result[i].onedrive.accessToken.encryptData, result[i].onedrive.accessToken.tag);
          let refreshToken = encryption.decrypt(result[i].onedrive.refreshToken.encryptData, result[i].onedrive.refreshToken.tag);
          let tokenExpiration = result[i].onedrive.expiresIn
          let expiresIn = result[i].onedrive.watch.expirationDateTime;
          let userId = result[i].user_id;
          let subscriptionId = result[i].onedrive.watch.id;

          refreshSubscription(accessToken, refreshToken, tokenExpiration, userId, subscriptionId, expiresIn);

        }

      }
    }
  });

});

var getUserDetails = function (idToken) {
  return new Promise((resolve, reject) => {
    var base64Url = idToken.split('.')[1];
    var responseObj = {}
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedData = JSON.parse(jsonPayload);
    let data = {};

    data.email = decodedData.preferred_username;
    data.name = decodedData.name;

    responseObj.status = true;
    responseObj.data = data
    resolve(responseObj);
  })
}

var getOnedriveUser = function (accessToken, refreshToken, expiresIn, userId,oneDriveUser) {
  let responseObj = {};
  console.log("One Drive User",oneDriveUser)
  var calendarUrl = `https://graph.microsoft.com/v1.0/users/`+oneDriveUser
//   `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '` + new Date().toISOString() + `'&$count=true&$orderby= start/dateTime&$top=1000`
  var events = new Promise((resolve, reject) => {
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      var options = {
        method: 'GET',
        url: calendarUrl,
        headers: {
          Authorization: "Bearer " + tokenResult.accessToken
        },
        json: true
      };

      request(options, (error, response, body) => {
        // if (error) {
        //   responseObj.status = false;
        //   responseObj.err = error;
        //   resolve(responseObj)
        // } else if (response.statusCode == 200) {
        //   responseObj.status = true;
        //   responseObj.data = body;
        //   resolve(responseObj)
        // } else {
        //   responseObj.status = false;
        //   responseObj.msg = "Status code error";
        //   responseObj.err = response;
        //   resolve(responseObj)
        // }

        let responseObj = {};
        if (error) {
            responseObj.status = false;
            responseObj.err = error;
            responseObj.msg = "Invalid Request. Please try again later";
            resolve(responseObj);

        } else {

            let json = body;
            if (json.id) {

                responseObj.status = true;
                responseObj.data = json;
                resolve(responseObj);

            } else {
                responseObj.status = false;
                responseObj.err = json;
                responseObj.msg = "Invalid Request. Please try again later";
                resolve(responseObj);
            }
        }
      })
    })

  })
  return events;
}


var getOnedriveFiles = function (accessToken, refreshToken, expiresIn, userId) {
  let responseObj = {};
  var calendarUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/Recordings:/children`
//   `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '` + new Date().toISOString() + `'&$count=true&$orderby= start/dateTime&$top=1000`
  var events = new Promise((resolve, reject) => {
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      var options = {
        method: 'GET',
        url: calendarUrl,
        headers: {
          Authorization: "Bearer " + tokenResult.accessToken
        },
        json: true
      };

      request(options, (error, response, body) => {
        if (error) {
          responseObj.status = false;
          responseObj.err = error;
          resolve(responseObj)
        } else if (response.statusCode == 200) {
          responseObj.status = true;
          responseObj.data = body;
          resolve(responseObj)
        } else {
          responseObj.status = false;
          responseObj.msg = "Status code error";
          responseObj.err = response;
          resolve(responseObj)
        }
      })
    })

  })
  return events;
}

var refreshTokens = function (accessToken, refreshToken, expiresIn, userId) {
  var db = mongo.getDB();
  var refreshTokenPromise = new Promise((resolve, reject) => {

    let responseObj = {};
    let clientId = conf.onedrive.client_id;
    let clientSecret = conf.onedrive.client_secret;

    var now = new Date();
    var expires = new Date(expiresIn);
    // Check if accessToken is expired or not 
    forceToken = false
    if (now < expires && !forceToken) {
      console.log("Not Expired");
      responseObj.status = true;
      responseObj.accessToken = accessToken;
      responseObj.expiresIn = expiresIn;
      resolve(responseObj);
    } else {
      console.log("Expired");
      const authUrl =
        'https://login.microsoftonline.com/common/oauth2/v2.0/token'

      console.log(authUrl)
      requestBody = {}
      requestBody.grant_type = "refresh_token";
      requestBody.refresh_token = refreshToken;
      requestBody.client_id = conf.onedrive.client_id;
      requestBody.scope = "https://graph.microsoft.com/files.readwrite openid profile offline_access user.read";
      requestBody.client_secret = encodeURIComponent(conf.onedrive.client_secret)
      console.log(requestBody)
      var options = {
        url: authUrl,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: requestBody,
        type: 'POST'
      };
      // console.log(refreshToken);
      request(options, function (error, response, body) {
        if (!error) {
          const json = JSON.parse(body);
          // console.log(json);
          if (!json.error) {
            // Check payload
            let onedrive = {};
            var now = new Date();

            let expiryDate = new Date(now.getTime() + json.expires_in * 1000);

            onedrive.accessToken = encryption.encrypt(json.access_token);
            onedrive.refreshToken = encryption.encrypt(json.refresh_token);
            onedrive.expiresIn = expiryDate;
            db.collection("integration_creds").update(
              { user_id: userId },
              { $set: { 'onedrive.accessToken': onedrive.accessToken, 'onedrive.refreshToken': onedrive.refreshToken, 'onedrive.expiresIn': onedrive.expiresIn, updated_time: new Date() } },
              { upsert: false },
              function (err, result) {
                if (err) {
                  responseObj.status = false;
                  responseObj.msg = "Error updating database with new refresh token"
                  responseObj.err = err
                  resolve(responseObj);
                  console.log(responseObj)
                } else {
                  responseObj.status = true;
                  responseObj.accessToken = json.access_token;
                  responseObj.expiresIn = expiryDate;
                  resolve(responseObj);
                }
              }
            );
          } else {
            responseObj.status = false;
            responseObj.msg = json
            resolve(responseObj);
          }
        } else {
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

var createSubscription = function (accessToken, refreshToken, expiresIn, userId) {
  let responseObj = {};
  var calendarUrl = `https://graph.microsoft.com/v1.0/subscriptions`
  var date = new Date(); // Now
  date.setMinutes(date.getMinutes() + 43200);
  var requestBody = {
    "changeType": "updated",
    "notificationUrl": conf.onedrive.notification_url + userId,
    "resource": "me/drive/root",
    "expirationDateTime": date.toISOString(),
  }
  var subscription = new Promise((resolve, reject) => {
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      var options = {
        method: 'POST',
        url: calendarUrl,
        headers: {
          Authorization: "Bearer " + tokenResult.accessToken
        },
        json: requestBody
      };

      request(options, (error, response, body) => {
        if (error) {
          responseObj.status = false;
          responseObj.err = error;
          resolve(responseObj)
        } else if (response.statusCode == 201) {
          responseObj.status = true;
          responseObj.data = body;
          resolve(responseObj)
        } else {
          responseObj.status = false;
          responseObj.msg = "Status code error";
          responseObj.err = response;
          responseObj.body = response.body
          resolve(responseObj)
        }
      })
    })

  })
  return subscription;
}

var stopEvents = function (accessToken, refreshToken, expiresIn, userId, calendarId, resourceId) {

  const options = {
    headers: {
      "Authorization": "Bearer " + accessToken
    }
  }

  var authUrl = 'https://graph.microsoft.com/v1.0/subscriptions/' + resourceId;

  var events = new Promise((resolve, reject) => {

    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {

      request.delete(authUrl, options, function (error, response, body) {
        let responseObj = {};
        if (error) {

          responseObj.status = false;
          responseObj.err = error;
          resolve(responseObj)

        } else if (response.statusCode == 200) {
          responseObj.status = true;
          responseObj.data = body;
          resolve(responseObj)
        } else {
          responseObj.status = false;
          responseObj.msg = "Status code error";
          responseObj.err = response;
          resolve(responseObj)
        }

      });

    });

  })
  return events;


}

var deltaRequest = function (accessToken, refreshToken, expiresIn, userId, url) {
  let responseObj = {};
  var onedriveUrl = url

  var subscription = new Promise((resolve, reject) => {
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      var options = {
        method: 'GET',
        url: onedriveUrl,
        headers: {
          Authorization: "Bearer " + tokenResult.accessToken
        },
        json: true
      };

      request(options, (error, response, body) => {
        if (error) {
          responseObj.status = false;
          responseObj.err = error;
          resolve(responseObj)
        } else if (response.statusCode == 200) {
          responseObj.status = true;
          responseObj.data = body;
          resolve(responseObj)
        } else {
          responseObj.status = false;
          responseObj.msg = "Status code error";
          responseObj.err = response;
          resolve(responseObj)
        }
      })
    })

  })
  return subscription;
}

var getFileContentURL = function (accessToken, refreshToken, expiresIn, userId, url) {
  let responseObj = {};
  var onedriveUrl = url

  var subscription = new Promise((resolve, reject) => {
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      var options = {
        method: 'GET',
        url: onedriveUrl,
        headers: {
          Authorization: "Bearer " + tokenResult.accessToken
        },
        json: true
      };

      request(options, (error, response, body) => {
        if (error) {
          responseObj.status = false;
          responseObj.err = error;
          resolve(responseObj)
        } else if (response.statusCode == 200) {
          responseObj.status = true;
          responseObj.data = body;
          responseObj.header = response.headers
          resolve(responseObj)
        } else {
          responseObj.status = false;
          responseObj.msg = "Status code error";
          responseObj.err = response;
          responseObj.header = response.headers
          resolve(responseObj)
        }
      })
    })

  })
  return subscription;
}



var initDeltaRequest = function (accessToken, refreshToken, expiresIn, userId, url) {
  let responseObj = {};
  var onedriveUrl = url
  var eventsArray = [];
  var delta = new Promise((resolve, reject) => {
    deltaRequest(accessToken, refreshToken, expiresIn, userId, url).then(response => {
      if (response.status == true) {
        console.log(response.data.value)
        eventsArray = eventsArray.concat(response.data.value)
        if (response.data["@odata.nextLink"]) {
          
          // eventsArray = eventsArray.concat(response.data.value)
          resolve(initDeltaRequest(accessToken, refreshToken, expiresIn, userId, response.data["@odata.nextLink"]))
        } else {
          // eventsArray = eventsArray.concat(response.data.value)
          resolve({ status: true, events: eventsArray, syncUrl: response.data["@odata.deltaLink"] })
        }
      } else {
        resolve({ status: false, events: eventsArray })
      }
    })
  })




  return delta;
}


var refreshSubscription = function (accessToken, refreshToken, expiresIn, userId, subscriptionId, subExpiration) {

  var db = mongo.getDB();
  var refreshSubscriptionPromise = new Promise((resolve, reject) => {

    let responseObj = {};
    let clientId = conf.onedrive.client_id;
    let clientSecret = conf.onedrive.client_secret;

    var now = new Date();
    var expires = new Date(subExpiration);


    // Check if accessToken is expired or not 
    console.log("current time:", now, "Expiry Time:", expires, userId)

    if (now < expires) {

      console.log("Not Expired");
      responseObj.status = true;
      responseObj.accessToken = accessToken;
      resolve(responseObj);

    } else {

      refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
        console.log("Expired One is ", userId);

        const authUrl =
          'https://graph.microsoft.com/v1.0/subscriptions/' + subscriptionId
        var date = new Date(); // Now
        date.setMinutes(date.getMinutes() + 4230);

        var requestBody = {
          "expirationDateTime": date.toISOString(),
        }

        var options = {
          url: authUrl,
          headers: { 'content-type': 'application/json', "Authorization": "Bearer " + tokenResult.accessToken },
          type: 'PATCH',
          json: requestBody
        };

        request(options, function (error, response, body) {
          console.log("update subscription outlook:", error, body, response.statusCode)
          if (!error) {

            const json = body;

            if (!json.error) {

              db.collection("integration_creds").update(
                { user_id: userId },
                { $set: { 'onedrive.watch': json } },
                { upsert: false },
                function (err, result) {
                  if (err) {
                    responseObj.status = false;
                    responseObj.msg = "Error updating database with new refresh token"
                    responseObj.err = err
                    resolve(responseObj);
                    console.log(responseObj)
                  } else {
                    responseObj.status = true;
                    responseObj.accessToken = json;
                    resolve(responseObj);
                  }
                }
              );
            } else if (json.error) {
              if (json.error.code && json.error.code == "ResourceNotFound") {
                console.log("Resource not found, creating new subscription", userId)
                createSubscription(tokenResult.accessToken, refreshToken, tokenResult.expiresIn, userId).then(subscription => {
                  console.log("New Subscription Data:", subscription, userId)
                  if (subscription.status == true) {
                    db.collection("integration_creds").update(
                      { user_id: userId },
                      { $set: { 'onedrive.watch': subscription.data } },
                      { upsert: false },
                      function (err, result) {
                        if (err) {
                          responseObj.status = false;
                          responseObj.msg = "Error updating database with new refresh token"
                          responseObj.err = err
                          resolve(responseObj);
                          console.log(responseObj)
                        } else {
                          responseObj.status = true;
                          responseObj.accessToken = json;
                          resolve(responseObj);
                        }
                      }
                    );
                  } else {
                    responseObj.status = false;
                    responseObj.msg = json
                    resolve(responseObj);
                  }
                })
              }
            } else {
              responseObj.status = false;
              responseObj.msg = json
              resolve(responseObj);
            }
          } else {
            responseObj.status = false;
            responseObj.msg = error;
            resolve(responseObj)
          }
          // console.log(options)


        });
      })


    }


  });

  return refreshSubscriptionPromise;

}

var createMarsviewFolder = function (accessToken, refreshToken, expiresIn, userId) {
  let responseObj = {};
  var calendarUrl = `https://graph.microsoft.com/v1.0/me/drive/root/children`
//   `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '` + new Date().toISOString() + `'&$count=true&$orderby= start/dateTime&$top=1000`
  let requestBody = {
    "name": "Recordings",
    "folder": { },
    "@microsoft.graph.conflictBehavior": "rename"
  }
  
  var events = new Promise((resolve, reject) => {
    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      var options = {
        method: 'POST',
        url: calendarUrl,
        headers: {
          Authorization: "Bearer " + tokenResult.accessToken
        },
        json: requestBody
      };

      request(options, (error, response, body) => {
        if (error) {
          responseObj.status = false;
          responseObj.err = error;
          resolve(responseObj)
        } else if (response.statusCode == 200 || response.statusCode == 201) {
          responseObj.status = true;
          responseObj.data = body;
          resolve(responseObj)
        } else {
          responseObj.status = false;
          responseObj.msg = "Status code error";
          responseObj.err = response;
          resolve(responseObj)
        }
      })
    })

  })
  return events;
}
module.exports = {
  getUserDetails,
  refreshTokens,
  getOnedriveFiles,
  createSubscription,
  stopEvents,
  deltaRequest,
  initDeltaRequest,
  refreshSubscription,
  createMarsviewFolder,
  getOnedriveUser,
  getFileContentURL
}