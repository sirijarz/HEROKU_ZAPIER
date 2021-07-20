var request = require('request');
const mongo  = require('./dbConnections');
var encryption = require('./encryptionUtilities');
var Config = require("../config/config");
const { options } = require('zeromq');
var conf = new Config();
var meetingInterface = require("./../routes/v2/Authentication & Profile/Profile/Zoom Meetings/Controllers/ControllerInterface")


var getContacts =  function(accessToken, domain) {
  let viewId = '';
  let userDetails = {};
  let responseObj = {};
  var userDetailsPromise = new Promise((resolve,reject) => {
    //testfresh13
  getContactsFilters(accessToken, domain).then((res) => {
    if(res.status == true) {

      viewId = res.data.filters[3].id;

      var bcURL = `https://${domain}.freshsales.io/api/contacts/view/${viewId}?include=owner`;

      let responseObj = {};

      request.get(
        {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Token token=" + accessToken
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

              // console.log(userDetails, "USERDATA")
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

    } else {
        responseObj.status = false;
        responseObj.msg = "Error fetching filters";
        resolve(responseObj);
    }
  })
  });

return userDetailsPromise;
}

var getContactsFilters =  function(accessToken, domain) {
  
  let userDetails = {};
  var userDetailsPromise = new Promise((resolve,reject) => {
   
  var bcURL = `https://${domain}.freshsales.io/api/contacts/filters`;

  let responseObj = {};

  request.get(
    {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token token=" + accessToken
        },
        url: bcURL
      },
      (error, response, result) => {
        let tempObj = JSON.parse(result);
        // console.log(bcURL)
        if (error || tempObj.login == 'failed') {
          responseObj.status = false;
          responseObj.msg = "Error getting user details";
          responseObj.err = error;
          resolve(responseObj);
          
        } else {
          // console.log(result);
          
          console.log(tempObj);
          userDetails = tempObj
          // console.log(userDetails, "USERDATA")
          if(userDetails.errors == undefined){

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

var createContact =  function(accessToken, domain, contactObject) {
    let responseObj = {};
    let userDetails = {};
    var userDetailsPromise = new Promise((resolve,reject) => {
     
    var bcURL = `https://${domain}.freshsales.io/api/contacts`;
  
    let updateObject = {
        "contact":{
        "first_name": contactObject.firstName,
        "last_name": contactObject.lastName,
        "email": contactObject.email,
        "owner_id": contactObject.ownerId
    }
    };
    console.log(updateObject)
    var options = {
        method: 'POST',
        url: bcURL,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token token=" + accessToken
        },
        body: updateObject,
        json:true
      };
    request.post(
      options,
        (error, response, result) => {
  
          console.log(result)
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error creating contact";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = result;
            // Removing token property
            userDetails = tempObj
            console.log(userDetails, "USERDATA")
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


var createNote =  function(accessToken, domain, contactId, notes, userId, fileName) {
    let responseObj = {};
    let userDetails = {};
    var userDetailsPromise = new Promise((resolve,reject) => {

      getContactDetails(accessToken, domain, contactId).then((contactResult) => {

        if(contactResult.status == true) {

          var bcURL = `https://${domain}.freshsales.io/api/phone_calls`;
  
          let updateObject = {
            "phone_call": { 
              "call_direction": false, 
              "targetable_type": "contact", 
              "targetable": { 
                "id": contactId, 
                "first_name": contactResult.data.contact.first_name, 
                "last_name": contactResult.data.contact.last_name,
                "email":contactResult.data.contact.email,
                "mobile_number":contactResult.data.contact.mobile_number 
              }, 
              "note": { 
                "description": notes
              } 
            }
          }
          console.log(updateObject)
          var options = {
              method: 'POST',
              url: bcURL,
              headers: {
                "Content-Type": "application/json",
                Authorization: "Token token=" + accessToken
              },
              body: updateObject,
              json:true
            };
          request.post(
            options,
            (error, response, result) => {
              console.log(result)
              if (error || result.errors != undefined) {
                responseObj.status = false;
                responseObj.msg = "Error creating note";
                responseObj.err = error;
                resolve(responseObj);
                
              } else {
                userDetails = result;
                if(userDetails != ''){
      
                  // Add to notes as well
                  let notesObject = {
                    "note":{
                    "description": notes,
                    "targetable_type": "Contact",
                    "targetable_id": contactId,
                  }
                }

                let notesUrl = `https://${domain}.freshsales.io/api/notes`
                let noteOptions = {
                  method: 'POST',
                  url: notesUrl,
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Token token=" + accessToken
                  },
                  body: notesObject,
                  json:true
                };
                request.post(
                  noteOptions,
                (error, response, notesResult) => {
                  if(error || notesResult.errors != undefined) {
                    responseObj.status = false;
                    responseObj.msg = notesResult.errors
                    resolve(responseObj)
                  } else {
                    let syncObj = {
                      contact: {
                        "first_name": contactResult.data.contact.first_name, 
                        "last_name": contactResult.data.contact.last_name,
                        "email":contactResult.data.contact.email,
                        "mobile_number":contactResult.data.contact.mobile_number,
                        "company": ""
                      },
                      crmType: "freshsales"
                    }
                    meetingInterface.zoomMeetingController.addMeetingSyncDetails(userId, fileName, syncObj).then((result) => {
                      if(result.status == true) {
                        responseObj.status = true;
                        responseObj.data = notesResult;
                        resolve(responseObj)
                      } else {
                        responseObj.status = false;
                        responseObj.data = notesResult;
                        resolve(responseObj)
                      }
                    })
                  }
                })
                  
                }else{
                    responseObj.status = false;
                    responseObj.data = userDetails;
                  resolve(responseObj)
                }
              }
            }
            );
        } else {
          responseObj.status = false;
          responseObj.msg = "Error fetching user details";
          resolve(responseObj);
        }
      })
    });
  
  return userDetailsPromise;
}

  var getContactDetails =  function(accessToken, domain, contactId) {
  
    let userDetails = {};
    var userDetailsPromise = new Promise((resolve,reject) => {
     
    var bcURL = `https://${domain}.freshsales.io//api/contacts/${contactId}`;
  
    let responseObj = {};
  
    request.get(
      {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Token token=" + accessToken
          },
          url: bcURL
        },
        (error, response, result) => {
          let tempObj = JSON.parse(result);
          // console.log(bcURL)
          if (error || tempObj.login == 'failed') {
            responseObj.status = false;
            responseObj.msg = "Error getting user details";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            // console.log(result);
            
            console.log(tempObj);
            userDetails = tempObj
            // console.log(userDetails, "USERDATA")
            if(userDetails.errors == undefined){
  
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
module.exports = {
    getContacts:getContacts,
    createContact: createContact,
    getContactsFilters: getContactsFilters,
    createNote: createNote,
    getContactDetails: getContactDetails
}