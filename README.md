# rshk-monitor

rshk-monitor is an API monitoring tool

# Getting Started
* Install <a href="https://nodejs.org/en/download/">Node.js with npm</a></li>
* Create `config/monitor.properties.ini` from `config/monitor.properties.ini-TEMPLATE`</li>
* Create `config/poll.config.csv` from `config/poll.config.csv-TEMPLATE`</li>
* Create `config/rfx.rates.properties.ini` from `config/rfx.rates.properties.ini-TEMPLATE`</li>
* Install the tool
```
npm install
```
* Start the tool
```
npm start
```

# Configuration

## monitor.properties.ini
- ```monitor.poll.config.file``` Location of the poll.config.csv file. Default: `./config/poll.config.csv`.
- ```monitor.alert.sender.email``` Email address of the email alert sender. It has to be an Outlook email.
- ```monitor.alert.sender.password``` Password of the email alert sender account.

## poll.config.csv
- ```route``` Location of JavaScript file to perform the polling
- ```schedule``` Cron expression of the polling schedule
- ```alert_recipient``` Email addresses of the recipients of the email alert
- ```alert_subject``` Subject of the email alert

## rfx.rates.properties.ini
- ```rfx.rates.poll.hostname``` Hostname of the RFX Rate API
- ```rfx.rates.poll.port``` Port of the RFX Rate API
- ```rfx.rates.poll.path``` Path of the RFX Rate API
- ```rfx.rates.poll.method``` Method of the RFX Rate API
- ```rfx.rates.poll.delay.therold``` Therold of the rate update time delay in millisecond. If the time difference between the polling time and the update time is greater than this therold, an email alert will be sent
- ```rfx.rates.poll.response.line.count``` Number of lines returned by the RFX Rate API to be defined as normal
- ```rfx.rates.key.#``` Mapping of currency pair code and name
