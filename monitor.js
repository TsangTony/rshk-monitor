let cron = require("node-cron");
let csvtojson = require('csvtojson');
let alert = require('./utils/monitor-alert');
let propertiesreader = require('properties-reader');

let properties = propertiesreader('./config/monitor.properties.ini');

let schedule = () => {
    csvtojson({delimiter: ",", noheader: false})
    .fromFile(properties.path().monitor.poll.config.file)
    .then((jobs) => {
        for (let job of jobs) {
            cron.schedule(job.schedule, () => {
                let route = require(job.route);
                route.poll(null, (result) => {
                    // check if the poll result is 200 OK, other send email alert
                    if (result.statusCode == 200) {
                        console.log(new Date() + 'OK');
                    }
                    else {
                        console.error(new Date() + JSON.stringify(result.message));
                        alert.send(result, job.alert_recipient, job.alert_subject);
                    }
                });
            });
        }
    });
}

module.exports.schedule = schedule;