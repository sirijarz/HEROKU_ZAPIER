var request = require("request");

var getAccessCredentials =  function(clientId, clientSecret) {
    var accessPromise = new Promise((resolve,reject) =>{
        var authorizationData =
        "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64");
      request.post(
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: authorizationData
          },
          url:
            "https://oauth.brightcove.com/v4/access_token?grant_type=client_credentials",
          body: ""
        },
        (err, response, body) => {
          if (err) {
            responseObj.status = false;
            responseObj.msg = "Error getting access for the user";
            responseObj.err = err;
          //   res.send(responseObj);
          //   console.error(err);
          // return responseObj
          resolve(responseObj)
          } else {
            var accessToken = JSON.parse(body);
            // console.log(accessToken)
            if(accessToken.access_token != undefined){
                responseObj.status = true;
                responseObj.data = accessToken;
                resolve(responseObj)
              //   return responseObj
            }else{
                responseObj.status = false;
                responseObj.msg = accessToken.error;
                responseObj.err = accessToken.error_description;
                resolve(responseObj)
              //   return responseObj
            }
            
          //   getBrightcoveUserData(accessToken.access_token, accountId);
          }
        }
      );
      
    })

    return accessPromise;
    
  }

  var getBrightcoveVideosCount = function(token,accountId,tags){
    if(tags != undefined && tags.length > 0){
      var bcURL = "https://cms.api.brightcove.com/v1/accounts/" + accountId + "/counts/videos?q=tags:"+tags
    }else{
      var bcURL = "https://cms.api.brightcove.com/v1/accounts/" + accountId + "/counts/videos"
    }
    var countPromise = new Promise((resolve,reject) => {
      request.get(
        {
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer " + token
          },
          url: bcURL
           
        },
        (error, response, result) => {
          if (error) {
            responseObj.status = false;
            responseObj.msg = "Error getting videos for the user";
            responseObj.err = error;
          //   res.send(responseObj);
          //   console.error(error);
          //  return responseObj
          resolve(responseObj)
          } else {
            // console.log(result);
            countData = JSON.parse(result);
            if(countData != undefined && countData.count != undefined){
              responseObj.status = true;
              responseObj.data = countData.count;
              resolve(responseObj)
            }else{
              responseObj.status = false;
              responseObj.err = "Error getting video count";
              resolve(responseObj)
            }                     
          //   res.send(responseObj);
          }
        }
      );
    })
    return countPromise;
  }

  var getBrightcoveVideos =  function(token, accountId,tags,limit,offset) {
      var videoPromise = new Promise((resolve,reject) => {
        if(tags != undefined && tags.length > 0){
          var bcURL = "https://cms.api.brightcove.com/v1/accounts/" + accountId + "/videos?&q=tags:"+tags+"&limit="+limit+"&offset="+offset+"&sort=-updated_at"
        }else{
          var bcURL = "https://cms.api.brightcove.com/v1/accounts/" + accountId + "/videos?limit="+limit+"&offset="+offset+"&sort=-updated_at"
        }
        
        request.get(
            {
              headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + token
              },
              url: bcURL
                
                
            },
            (error, response, result) => {
              console.log(bcURL)
              if (error) {
                responseObj.status = false;
                responseObj.msg = "Error getting videos for the user";
                responseObj.err = error;
              //   res.send(responseObj);
              //   console.error(error);
              //  return responseObj
              resolve(responseObj)
              } else {
                // console.log(result);
                userData = JSON.parse(result);
                if(userData.length > 0){
                    // console.log(userData[0])
                    if(userData[0].error_code != undefined){
                        responseObj.status = false;
                        responseObj.msg = userData[0].message;
                      //   return  responseObj;
                      resolve(responseObj)
                      
                    }else{
                        responseObj.status = true;
                        responseObj.data = userData
                        // return  responseObj; 
                        resolve(responseObj)
                    }
                }else{
                    responseObj.status = true;
                    responseObj.data = userData
                  //   return  responseObj;
                  resolve(responseObj)
                }
                         
              //   res.send(responseObj);
              }
            }
          );
      })
    return videoPromise
  }

  module.exports = {
       getAccessCredentials: getAccessCredentials,
       getBrightcoveVideos:getBrightcoveVideos,
       getBrightcoveVideosCount:getBrightcoveVideosCount
  }