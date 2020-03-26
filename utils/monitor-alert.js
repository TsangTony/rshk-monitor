let https = require('https')
let nodeoutlook = require('nodejs-nodemailer-outlook');
let propertiesreader = require('properties-reader');

let properties = propertiesreader('./config/monitor.properties.ini');

/**
 * Send an 
 * @param {*} result 
 * @param {*} recipient 
 * @param {*} subject 
 */
let send = (result, recipient, subject) => {
    // send alert email
    let html = '';
    for (let error of result.message.errors) {
        if (error.currency != null) {
            html += '<br />Currency: ' + error.currency;
        }
        if (error.delay != null) {
            html += '<br />Delay: ' + (error.delay / 60000).toFixed(1) + ' minute(s)';
        }
        if (error.error != null) {
            html += '<br />Error Message: ' + error.error;
        }
        if (error.payload != null) {
            html += '<br />Payload: ' + error.payload;
        }
        html += '<br />';
    }
    
    nodeoutlook.sendEmail({
        auth: {
            user: properties.path().monitor.alert.sender.email,
            pass: properties.path().monitor.alert.sender.password
        },
        from: properties.path().monitor.alert.sender.email,
        to: recipient,
        subject: subject,
        html: html,
        text: html.replace(/<br\s\/>/g,'\r\n'),
        onError: (e) => {
            console.error(e);
        },
        onSuccess: (i) => {
            //console.log(i);
        }
    });
}

module.exports.send = send;