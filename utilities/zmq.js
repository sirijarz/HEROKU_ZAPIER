var zmq = require('zeromq');
var sock;

function openSocket(){
    try{
        sock  = zmq.socket('req');
        sock.bind('tcp://127.0.0.1:3100');
        
        console.log("ZMQ socket listening to 3100");
        return sock;
        
    }catch(err){
        console.error(err)
    }
}

function getSocket(){
    if(sock == undefined){
        return  openSocket();
    }else{
        return sock;
    }
    
}


module.exports = {
    openSocket,getSocket
};