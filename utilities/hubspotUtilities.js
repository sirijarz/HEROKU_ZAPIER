var request = require('request');
const mongo  = require('./dbConnections');
var encryption = require('./encryptionUtilities');
var Config = require("../config/config")
var conf = new Config();
var meetingInterface = require("./../routes/v2/Authentication & Profile/Profile/Zoom Meetings/Controllers/ControllerInterface")


var getHubspotUserDetails =  function(accessToken) {
  
  let userDetails = {};
  var userDetailsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`;

  let responseObj = {};

  request.get(
      bcURL,
      (error, response, result) => {

        // console.log(bcURL)
        if (error) {
          responseObj.status = false;
          responseObj.msg = "Error getting user details";
          responseObj.err = error;
          resolve(responseObj);
          
        } else {
          
          let tempObj = JSON.parse(result);
          // Removing token property
          delete tempObj.token;
          userDetails = tempObj
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

var getHubspotUserContacts =  function(accessToken, refreshToken, expiresIn, userId) {
  
  
  var userContactsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=10`;

  let responseObj = {};

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {

    request.get(
      {
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer " + result.accessToken
        },
        url: bcURL
      },
        (error, response, result) => {
  
          
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error getting contacts";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = JSON.parse(result);
            // console.log(tempObj)
            if(tempObj != ''){
  
              responseObj.status = true;
              responseObj.data = tempObj;
              
              resolve(responseObj);
            }else{
                responseObj.status = false;
                responseObj.data = tempObj;
              resolve(responseObj)
            }
          }
        }
      );
  });
  
  });

return userContactsPromise;
}

var addNotesToHubspot=  function(accessToken, refreshToken, expiresIn, userId, contactId, notes, fileName) {
  
  // console.log(notes, "HERRERE");

  var addNotesPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.hubapi.com/engagements/v1/engagements`;

  let responseObj = {};
   let contactIdArray = [];
   contactIdArray.push(contactId);;
  
  let updateObject = {
    "engagement": {
        "active": true,
        "type": "NOTE",
        "timestamp": Date.now()
    },
    "associations": {
        "contactIds": contactIdArray,
        "companyIds": [],
        "dealIds": [],
        "ownerIds": [],
		"ticketIds":[]
    },
    "attachments": [],
    "metadata": {
        "body": notes
    }
  }

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {

    var options = {
      method: 'POST',
      url: bcURL,
      headers: {
       Authorization: 'Bearer ' + result.accessToken
      },
      body: updateObject,
      json:true
    };
    request(options, function (error, response, body) {
   
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error syncing with hubspot";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = response;
            
            if(tempObj != ''){
              getContactDetails(accessToken, refreshToken, expiresIn, userId, contactId).then((response)=> {
                if(response.status == true) {
                  console.log("YRRLRLRLR")
                  console.log(response.data)
                  let syncObj = {}
                    syncObj.contact = {
                      "first_name": response.data.body.properties.firstname.value, 
                      "last_name": response.data.body.properties.lastname.value,
                      "email": response.data.body.properties.email.email,
                      "mobile_number": "",
                      "company": "",                    
                    crmType: "hubspot"
                  }
                  contact = {}
                  if(response.data.body["associated-company"] != undefined) {
                    contact.crmType = response.data.body["associated-company"].properties.name.value;
                    syncObj.contact.company = response.data.body["associated-company"].properties.name.value; 
                  }
                  meetingInterface.zoomMeetingController.addMeetingSyncDetails(userId, fileName, syncObj).then((result) => {
                    if(result.status == true) {
                      responseObj.status = true;
                      responseObj.data = tempObj;
                      resolve(responseObj)
                    } else {
                      responseObj.status = false;
                      responseObj.data = tempObj;
                      resolve(responseObj)
                    }
                  })
                } else {
                  responseObj.status = true;
                  responseObj.data = response;
                  resolve(responseObj);
                }
              })
             
            }else{
                responseObj.status = false;
                responseObj.data = tempObj;
              resolve(responseObj)
            }
          }
        }
      );
  });
  
  });

return addNotesPromise;
}

var createContact=  function(accessToken, refreshToken, expiresIn, userId, contactDetails, notes) {
  
  // console.log(notes, "HERRERE");

  var createContactPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.hubapi.com/contacts/v1/contact`;

  let responseObj = {};
   let contactIdArray = [];
  
  let updateObject = {
    "properties": [
      {
        "property": "email",
        "value": contactDetails.email
      },
      {
        "property": "firstname",
        "value": contactDetails.firstName
      },
      {
        "property": "lastname",
        "value": contactDetails.lastName
      }
    ]
  }

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {

    var options = {
      method: 'POST',
      url: bcURL,
      headers: {
       Authorization: 'Bearer ' + result.accessToken
      },
      body: updateObject,
      json:true
    };
    request(options, function (error, response, body) {
   
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error syncing with hubspot";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = response;
            
            if(tempObj != ''){
  
              responseObj.status = true;
              responseObj.data = tempObj;
              
              resolve(responseObj);
            }else{
                responseObj.status = false;
                responseObj.data = tempObj;
              resolve(responseObj)
            }
          }
        }
      );
  });
  
  });

return createContactPromise;
}

var refreshTokens = function(accessToken, refreshToken, expiresIn, userId) {
    var db = mongo.getDB();
    var refreshTokenPromise = new Promise((resolve,reject) => {
    
    let responseObj = {};

    var now = new Date();
    var expires = new Date(expiresIn);
    // Check if accessToken is expired or not 
    
    if(now < expires) {
        // console.log("Not Expired");
        responseObj.status = true;
        responseObj.accessToken = accessToken;
        resolve(responseObj);
    } else {
        // console.log(conf.hubspotClientId, conf.hubspotClientSecret);
        var options = {
            method: 'POST',
            url: `https://api.hubapi.com/oauth/v1/token?grant_type=refresh_token&client_id=${conf.hubspotClientId}&client_secret=${conf.hubspotClientSecret}&refresh_token=${refreshToken}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded;charset=utf-8",
            }
        };
        // console.log(options);
        request(options, function (error, response, body) {
          if(!error){
            const json = JSON.parse(body);
            // console.log(json);
            if(!json.error && json.access_token != undefined) {
                 // Check payload
                 let hubspot = {};
                 var now = new Date();
          
                 let expiryDate = new Date(now.getTime() + json.expires_in*1000);
                //  console.log(json)
                 hubspot.accessToken = encryption.encrypt(json.access_token);
                 hubspot.refreshToken = encryption.encrypt(json.refresh_token)
                 hubspot.expiresIn = expiryDate;
                 db.collection("integration_creds").update(
                  { user_id: userId },
                  { $set: { 'hubspot.accessToken' : hubspot.accessToken,'hubspot.refreshToken' : hubspot.refreshToken, 'hubspot.expiresIn': hubspot.expiresIn, updated_time: new Date() } },
                  { upsert: false },
                  function(err, result) {
                    if (err) {
                      responseObj.status = false;
                      responseObj.msg = "Error updating database with new refresh token"
                      responseObj.err = err
                      resolve(responseObj);
                      // console.log(responseObj)
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
        });
    }

    
  });

  return refreshTokenPromise;
}

var getContactDetails=  function(accessToken, refreshToken, expiresIn, userId, contactId) {
  
  var createContactPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://api.hubapi.com/contacts/v1/contact/vid/${contactId}/profile`;

  let responseObj = {};
  

  refreshTokens(accessToken, refreshToken, expiresIn, userId).then(result => {

    var options = {
      method: 'GET',
      url: bcURL,
      headers: {
       Authorization: 'Bearer ' + result.accessToken
      },
      json:true
    };
    request(options, function (error, response, body) {
   
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error syncing with hubspot";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = response;
            
            if(tempObj != ''){
  
              responseObj.status = true;
              responseObj.data = tempObj;
              
              resolve(responseObj);
            }else{
                responseObj.status = false;
                responseObj.data = tempObj;
              resolve(responseObj)
            }
          }
        }
      );
  });
  
  });

return createContactPromise;
}

module.exports = {
    refreshTokens: refreshTokens,
    getHubspotUserDetails:getHubspotUserDetails,
    getHubspotUserContacts:getHubspotUserContacts,
    addNotesToHubspot: addNotesToHubspot,
    createContact: createContact,
    getContactDetails: getContactDetails
}