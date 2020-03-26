let express = require('express');
let router = express.Router();
let https = require('https')
let csvtojson = require('csvtojson');
let propertiesreader = require('properties-reader');

let poll = (properties, callback) => {
    if (!properties) properties = propertiesreader('./config/rfx.rates.properties.ini');

    let now = new Date();
    // TODO consider daylight saving
    if ((now.getDay() == 6 && now >= (new Date()).setHours(4,55,0) ) ||
        now.getDay() == 0 ||
        (now.getDay() == 1 && now <= (new Date()).setHours(6,0,0)) ||
        (now >= (new Date()).setHours(4,55,0) && now <= (new Date()).setHours(5,10,0))) {
        // non market hours alway return OK
        let result = {
            statusCode: 200,
            message: {
                statusCode: 200
            }
        }
        callback(result);
    }
    else {
        
        // RFX rate API request
        let options = {
            hostname: properties.path().rfx.rates.poll.hostname,
            port: properties.path().rfx.rates.poll.port,
            path: properties.path().rfx.rates.poll.path,
            method: properties.path().rfx.rates.poll.method
        }
        
        let req = https.request(options, (res) => {
            let message = '';
            res.on('data', (chunk) => {
                message += chunk;
            });
        
            res.on('end', () => {
                if (res.statusCode == 200) {

                    // convert the response format to json
                    csvtojson({delimiter: "\t", noheader: true})
                    .fromString(message)
                    .then((rates) => {
                        let errors = [];
        
                        if (rates.length == properties.path().rfx.rates.poll.response.line.count) {
                            // rates start at row 3
                            for (let i = 2; i < rates.length; i++) {
                                let updateDatetimeStr = rates[i].field21;
                                let currency = properties.get('rfx.rates.key.' + rates[i].field1);
    
                                // skip the currency pair that are opt out for checking
                                if (currency == null) continue;
    
                                if (updateDatetimeStr != null && updateDatetimeStr.length == 17) {
                                    let updateDatetime = new Date(updateDatetimeStr.slice(0, 4), updateDatetimeStr.slice(4, 6) - 1, updateDatetimeStr.slice(6, 8),
                                                                    updateDatetimeStr.slice(8, 10), updateDatetimeStr.slice(10, 12), updateDatetimeStr.slice(12, 14), updateDatetimeStr.slice(14, 17));
                                    // difference in milliseconds
                                    let diff = now - updateDatetime;
                                    
                                    // error if the difference is larger then the therold
                                    if (diff > properties.path().rfx.rates.poll.delay.therold) {
                                        errors.push({
                                            currency: currency,
                                            delay: diff
                                        });
                                    }
                                }
                                else {
                                    // the last updated date/time is malformatted or missing
                                    errors.push({
                                        currency: currency,
                                        error: 'Unable to find the last updated date/time',
                                        payload: JSON.stringify(rates[i])
                                    });
                                }
                            }
                        }
            
                        let statusCode = errors.length == 0 ? 200 : 500;
                        let result = {
                            statusCode: statusCode,
                            message: {
                                statusCode: statusCode,
                                errors: errors
                            }
                        }
                        callback(result);
                    })
                }
                else {
                    // RFX rates API return error
                    let result = {
                        statusCode: res.statusCode,
                        message: {
                            statusCode: res.statusCode,
                            errors: [{error : 'Unable to call the RFX Rates API: ' + res.statusMessage}]
                        }
                    }
                    callback(result);
                }
        
            });
        });
        
        // error when calling the rfx rates API
        req.on('error', (err) => {
            let result = {
                statusCode: 500,
                message: {
                    statusCode: 500,
                    errors: [{error : 'Unable to call the RFX Rates API: ' + err.message}]
                }
            }
            callback(result);
        });
        
        req.end();
    }
}


router.get('/', (req, res, next) => {
    poll(null, (result) => {
        res.status(result.statusCode).send(result.message);
    })
});

module.exports = router;
module.exports.poll = poll;