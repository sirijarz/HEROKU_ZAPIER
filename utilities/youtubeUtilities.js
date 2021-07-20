var request = require("request");
var googleUtility = require("../utilities/googleUtilities");
var getYoutubeChannelDetails =  function(token, apiKey) {
    var videoPromise = new Promise((resolve,reject) => {
     
    var bcURL = `https://www.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&mine=true&key=${apiKey}`;

    let responseObj = {};
      
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

var getYoutubeVideos =  function(refreshToken, accessToken, apiKey, userId, channelId, limit) {
  
  let responseObj = {};

  var videoPromise = new Promise((resolve,reject) => {

    googleUtility.refreshTheToken(refreshToken, accessToken, userId).then((value) => {

      // console.log("GOKEN", value);

      var bcURL = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10`;
    
      request.get(
          {
            headers: {
              "content-type": "application/json",
              Authorization: "Bearer " + value.access_token
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
              // console.log(userData, "USERDATA")
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
      
    });
    
   
  });
return videoPromise

}

module.exports = {
  getYoutubeChannelDetails:getYoutubeChannelDetails,
  getYoutubeVideos: getYoutubeVideos
}