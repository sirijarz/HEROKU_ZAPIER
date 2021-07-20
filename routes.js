// var express = require('express');
// var app = express();
// var PORT = 3000;
  
// // Single routing
// var router = express.Router();
    
// router.get('/', function (req, res, next) {
//     console.log("Router Working");
//     res.end();
// })
  
// app.use(router);
  
// app.listen(PORT, function(err){
//     if (err) console.log(err);
//     console.log("Server listening on PORT", PORT);
// });
var express = require('express');
const { monitoring } = require('googleapis/build/src/apis/monitoring');
var app = express();
var router = express.Router();
var controller = require('./Controller/ControllerInterface');
var  PORT = 3000;
app.use(express.json());
var mongo = require('./utilities/dbConnections')
mongo.connectDB();

router.post('/integrations/zapier/generate_api_key', function(req,res){
   
    controller.zapierController.createApikey(req.body.email).then(function(response){
        console.log(response)
        res.send(response);
    })
})
router.get('/integrations/zapier/zapier_user/:email/:api_key', function(req,res){

    controller.zapierController.getZapierUser(req.params.email, req.params.api_key).then(function(response){
       
        res.send(response);
    })
})
// Google Drive and One Drive to get videos API
router.put('/integrations/zapier/printdata/:email', function(req,res){
    console.log(req.body)
    controller.zapierController.printData(req.params.email,req.body).then(function(response){
         
        res.send(response);
    })
})











app.use(router);
  
app.listen(PORT, function(err){
     if (err) console.log(err);
     console.log("Server listening on PORT", PORT);
 });



module.exports = router