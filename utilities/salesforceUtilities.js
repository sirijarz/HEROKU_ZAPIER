var request = require('request');
const mongo  = require('./dbConnections');
var encryption = require('./encryptionUtilities');
var Config = require("../config/config")
var conf = new Config();
var meetingInterface = require("./../routes/v2/Authentication & Profile/Profile/Zoom Meetings/Controllers/ControllerInterface")

var getSalesforceUserDetails =  function(accessToken) {
  
  let userDetails = {};
  var userDetailsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://login.salesforce.com/services/oauth2/userinfo`;

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
          
          let tempObj = JSON.parse(result);
    
          userDetails = tempObj
          // console.log(userData, "USERDATA")
          if(userDetails != ''){

            responseObj.status = true;
            responseObj.data = userDetails;
            
            resolve(responseObj);
          }else{
            //   console.log("Here", result);
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

var getSalesforceUserContacts =  function(accessToken, refreshToken, expiresIn, userId, url) {
  
  
  var userContactsPromise = new Promise((resolve,reject) => {

    var myRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
 
    var domain = myRegexp.exec(url);
   
  var bcURL = domain[0] + "/services/data/v20.0/sobjects/Contact";

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
            console.log(tempObj)
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

var addNotesToSalesforce=  function(accessToken, refreshToken, expiresIn, userId, contactId, notes, url, fileName) {
  
  // console.log(url, "HERRERE");

  var addNotesPromise = new Promise((resolve,reject) => {

     var myRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
 
     var domain = myRegexp.exec(url);

  var bcURL = domain[0] + "/services/data/v48.0/sobjects/Task";

  let responseObj = {};
  
  let updateObject = {
    "WhoId": contactId,
    "Description": notes,
    "Subject": "Call",
    "Status": "Completed",
    "TaskSubtype": "Call"
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
    // console.log(options)
    request(options, function (error, response, body) {
   
          if (error) {
            console.log(error);
            responseObj.status = false;
            responseObj.msg = "Error syncing with salesforce";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = response;
            if(tempObj != ''){

              getSalesforceContactDetails(accessToken, refreshToken, expiresIn,userId, url, contactId).then((result2)=> {

                if(result2.status == true) {
                  let syncObj = {
                    contact: {
                      "first_name": result2.data.FirstName, 
                      "last_name": result2.data.LastName,
                      "email":result2.data.Email,
                      "mobile_number":result2.data.Phone,
                      "company": ""
                    },
                    crmType: "salesforce"
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
                  responseObj.data = tempObj;
                  resolve(responseObj)
                }
              })
            }else{
              console.log(tempObj);
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

var createContact=  function(accessToken, refreshToken, expiresIn, userId, contactDetails, url) {

  var createContactPromise = new Promise((resolve,reject) => {
  
  var myRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;

  var domain = myRegexp.exec(url);
   
  var bcURL = domain[0] + "/services/data/v20.0/sobjects/Contact";

  let responseObj = {};

   let contactIdArray = [];
  
  let updateObject = {
    "FirstName": contactDetails.firstName,
    "LastName": contactDetails.lastName,
    "Email": contactDetails.email
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
            responseObj.msg = "Error syncing with salesforce";
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

    console.log("Expired");
        var options = {
            method: 'POST',
            url: `https://login.salesforce.com/services/oauth2/token?grant_type=refresh_token&client_id=${conf.salesforceClientId}&client_secret=${conf.salesforceClientSecret}&refresh_token=${refreshToken}`,
            headers: {
                "content-type": "application/x-www-form-urlencoded;charset=utf-8",
            }
        };
        // console.log(refreshToken);
        request(options, function (error, response, body) {
          if(!error){
            const json = JSON.parse(body);
            console.log(json);
            if(!json.error) {
                 // Check payload
                 let salesforce = {};
                 var now = new Date();
          
                 let expiryDate = new Date(now.getTime() + json.issued_at);
                        
                 salesforce.accessToken = encryption.encrypt(json.access_token);
                 salesforce.expiresIn = expiryDate;
                 db.collection("integration_creds").update(
                  { user_id: userId },
                  { $set: { 'salesforce.accessToken' : salesforce.accessToken , 'salesforce.expiresIn': salesforce.expiresIn, updated_time: new Date() } },
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
        });

    
  });

  return refreshTokenPromise;
}
// /services/data/v20.0/sobjects/Contact/0032w00000FQ2soAAD

var getSalesforceContactDetails =  function(accessToken, refreshToken, expiresIn, userId, url, contactId) {
  
  
  var userContactsPromise = new Promise((resolve,reject) => {

    var myRegexp = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
 
    var domain = myRegexp.exec(url);
   
  var bcURL = domain[0] + `/services/data/v20.0/sobjects/Contact/${contactId}`;

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
            responseObj.msg = "Error getting contact details";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = JSON.parse(result);
            console.log(tempObj)
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
module.exports = {
    refreshTokens: refreshTokens,
    getSalesforceUserDetails:getSalesforceUserDetails,
    getSalesforceUserContacts:getSalesforceUserContacts,
    addNotesToSalesforce: addNotesToSalesforce,
    createContact: createContact,
    getSalesforceContactDetails: getSalesforceContactDetails
}