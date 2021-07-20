const nodemailer = require('nodemailer');
var express = require('express');
var fs = require('fs');

function sendEmail(){
    

    
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            name: 'www.marsview.ai',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "admin@marsview.ai", // generated ethereal user
                pass: "Visio123" // generated ethereal password
            },
            tls: {
                rejectUnauthorized:false
            }
        });
     return transporter;
        // setup email data with unicode symbols
        
}

var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};



module.exports = {sendEmail,readHTMLFile};