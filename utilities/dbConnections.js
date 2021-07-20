var mongoClient = require("mongodb").MongoClient;
// var url = 'mongodb://god:GodsMustBeCrazy@101.53.141.87:27017/Marsview';
// var url = 'mongodb://101.53.142.37:27017/Marsview'
// console.log(process.env.NODE_ENV)
if(process.env.NODE_ENV == "development"){
  var url = "mongodb://" + process.env.MONGO + "/Marsview?authSource=admin";
}
else if(process.env.NODE_ENV == "notes"){
  var url = "mongodb://" + process.env.MONGO + "/Marsview?authSource=admin"; 
}
else{
   var url="mongodb+srv://sirijarz:sirijarz@cluster0.wjids.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  // var url = "mongodb://localhost/Marsview";
  // var url = "mongodb://" + process.env.MONGO + "/Marsview";
}

// var url = "mongodb://" + process.env.MONGO + "/Marsview1";

// var url = "mongodb://localhost/Marsview";
// var url = "mongodb://localhost:27017/Marsview";
let _db;

const connectDB = async callback => {
  try {
    console.log(url)
    mongoClient.connect(url, (err, datab) => {
      // console.log(err)
      console.log("Mongo Connected");

      //   datab.authenticate(process.env.MU, process.env.MP, function(err, res) {
      //     if(!err) {
      //         console.log("Authenticated");
      //         _
      //     } else {
      //         console.log("Error in authentication.");

      //         console.log(err);
      //     }
      // });
      _db = datab.db("zapierDB");
      // console.log(datab)

      // console.log(_db)
      // return callback(err)
    });
  } catch (e) {
    console.log(e);
  }
};

const getDB = () => _db;

const disconnectDB = () => _db.close();

module.exports = { connectDB, getDB, disconnectDB };

var connection = getDB();

// var mongoClient = require('mongoose');
// var url = 'mongodb://localhost/Asthetics';
// let _db;

// const connectDB = async (callback) => {
//     try {
//         mongoClient.connect(url, (err, datab) => {
//             // console.log(err)
//             console.log('Mongo Connected')
//             // _db = datab.db("Asthetics")
//             // console.log(datab)
//            // return callback(err)
//         })
//     } catch (e) {
//         throw e
//     }
// }

// const getDB = () => _db

// const disconnectDB = () => _db.close()

// module.exports = { connectDB, getDB, disconnectDB }

// var connection = getDB();
