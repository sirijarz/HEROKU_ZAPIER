var request = require("request");
const fs = require("fs");
const mongo  = require('../utilities/dbConnections'); 
var encryption = require('../utilities/encryptionUtilities');
var Config = require('../config/config')
var conf = new Config();
let googleCreds = {
  client_id: "307378174190-dlpkb9hp2pqc3i8iv2abttvhhje1or42.apps.googleusercontent.com",
  client_secret: "J-JF8ylHSzqECXqeXHfzuhh_",
  redirect_uri: "https://notes.marsview.ai/media/integration?auth=Drive",
  scopes: "https%3A//www.googleapis.com/auth/drive.file  https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
}
var addNoteToDrive =  function(accessToken,refreshToken, expiresIn, filePath, fileTitle, userId) {
    let responseObj = {};
    let dataRes = {};
    var userDetailsPromise = new Promise((resolve,reject) => {

      refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {

        fs.readFile(filePath, function (err, content) {
          if (err) {
            console.error(err);
          }
          const metadata = {
            name: fileTitle +".txt",
          };
          const boundary = "xxxxxxxxxx";
          let data = "--" + boundary + "\r\n";
          data += 'Content-Disposition: form-data; name="metadata"\r\n';
          data += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
          data += JSON.stringify(metadata) + "\r\n";
          data += "--" + boundary + "\r\n";
          data += 'Content-Disposition: form-data; name="file"\r\n\r\n';
          const payload = Buffer.concat([
            Buffer.from(data, "utf8"),
            Buffer.from(content, "binary"),
            Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
          ]);
          request(
            {
              method: "POST",
              url:
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
              headers: {
                Authorization: "Bearer " + tokenResult.accessToken,
                "Content-Type": "multipart/form-data; boundary=" + boundary,
              },
              body: payload,
            },
            (err, res, body) => {
              if (err) {
                console.log(body)
                responseObj.status = true;
                responseObj.data = body;
                resolve(responseObj);
              } else {
                console.log(body, "AADDIINGGG")
                let parsedBody = JSON.parse(body)
                renameDriveFile(tokenResult.accessToken, fileTitle, parsedBody.id).then((response) => {
                  if(response.status == true) {
                    responseObj.status = true;
                    responseObj.data = response.data;
                    resolve(responseObj);
                  } else {
                    responseObj.status = false;
                    responseObj.data = response;
                    resolve(responseObj);
                  }
              })
              }
            }
          );
        });
      })
    });
  
  return userDetailsPromise;
}

var updateNotesInDrive =  function(accessToken,refreshToken, expiresIn, fileId, filePath, fileTitle, userId) {
    let responseObj = {};
    let userDetails = {};
    var userDetailsPromise = new Promise((resolve,reject) => {
     
    var bcURL = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

    refreshTokens(accessToken, refreshToken, expiresIn, userId).then((tokenResult) => {
      fs.readFile(filePath, function (err, content) {
        if (err) {
          console.error(err);
        }
        const metadata = {
          name: fileTitle +".txt",
        };
        const boundary = "xxxxxxxxxx";
        let data = "--" + boundary + "\r\n";
        data += 'Content-Disposition: form-data; name="metadata"\r\n';
        data += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
        data += JSON.stringify(metadata) + "\r\n";
        data += "--" + boundary + "\r\n";
        data += 'Content-Disposition: form-data; name="file"\r\n\r\n';
        const payload = Buffer.concat([
          Buffer.from(data, "utf8"),
          Buffer.from(content, "binary"),
          Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
        ]);
        request(
          {
            method: "PATCH",
            url:
              `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
            headers: {
              Authorization: "Bearer " + tokenResult.accessToken,
              "Content-Type": "multipart/form-data; boundary=" + boundary,
            },
            body: payload,
          },
          (err, res, body) => {
            if (err) {
              console.log(body)
              responseObj.status = true;
              responseObj.data = body;
              resolve(responseObj);
            } else {
              console.log(body, "UPPDDAATTTEE")
              let parsedBody = JSON.parse(body)
              renameDriveFile(tokenResult.accessToken, fileTitle, parsedBody.id).then((response) => {
                if(response.status == true) {
                  responseObj.status = true;
                  responseObj.data = response.data;
                  resolve(responseObj);
                } else {
                  responseObj.status = false;
                  responseObj.data = response;
                  resolve(responseObj);
                }
            })
            }
          }
        );
      });
    })
  });
  
  return userDetailsPromise;
}

var renameDriveFile =  function(accessToken, name, fileId) {
    let responseObj = {};
    let userDetails = {};
    var userDetailsPromise = new Promise((resolve,reject) => {
     
    var bcURL = `https://www.googleapis.com/drive/v2/files/${fileId}`;
  
    let data = {
        title: name,
    };
    // console.log(updateObject)
    var options = {
        method: 'PUT',
        url: bcURL,
        headers: {
          Authorization: "Bearer " + accessToken
        },
        body: data,
        json:true
      };
    request.put(
      options,
        (error, response, result) => {
  
          console.log(result)
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error adding note to drive";
            responseObj.err = error;
            resolve(responseObj);
            
          } else {
            
            let tempObj = result;
            // Removing token property
            userDetails = tempObj
            console.log(userDetails, "USERDATA")
            if(userDetails != '' && userDetails.error == undefined){
  
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

var refreshTokens = function(accessToken, refreshToken, expiresIn, userId) {
  var db = mongo.getDB();
  let responseObj = {};
  var now = new Date();
  var expires = new Date(expiresIn);
    console.log(accessToken, refreshToken, expiresIn)
  var refreshTokenPromise = new Promise((resolve,reject) => {
    if(expires > now) {
      // console.log("Not Expired");
      responseObj.status = true;
      responseObj.accessToken = accessToken;
      resolve(responseObj);
  } else {
    let options = {
      'method': 'POST',
      'url': `https://oauth2.googleapis.com/token?client_id=${conf.googleCreds.client_id}&client_secret=${conf.googleCreds.client_secret}&grant_type=refresh_token&refresh_token=${refreshToken}`,
      'headers': {
      }
    };
  request(options, function (error, response, body) {
 
        if (error) {
          responseObj.status = false;
          responseObj.msg = "Error syncing with hubspot";
          responseObj.err = error;
          resolve(responseObj);
          
        } else {
          
          
          let json = JSON.parse(response.body);
          console.log(json.body)
          let accessToken = encryption.encrypt(json.access_token);
          let expiresIn = json.expires_in;
          
          if(json != '' && json.error == undefined){
            db.collection("integration_creds").update(
              { user_id: userId },
              { $set: { "googleDrive.accessToken": accessToken,"googleDrive.expiresIn": expiresIn, updated_time: new Date() } },
              { upsert: true },
              function (err, result) {
                  if (err) {
                      responseObj.status = false;
                      responseObj.msg = "Error saving data";
                      responseObj.accessToken = json.access_token;
                  } else {
                    responseObj.status = true;
                    responseObj.accessToken = json.access_token;
                    resolve(responseObj);
                  }
              }
          );
           
          }else{
              responseObj.status = false;
              responseObj.data = tempObj;
            resolve(responseObj)
          }
        }
      }
    );
  }
  
  }) 
  return refreshTokenPromise; 
};

module.exports = {
    addNoteToDrive: addNoteToDrive,
    updateNotesInDrive: updateNotesInDrive,
    renameDriveFile: renameDriveFile,
    refreshTokens: refreshTokens
}