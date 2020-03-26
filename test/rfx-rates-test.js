let assert = require('assert');
let nock = require('nock');
let rfxrates = require("../routes/rfx-rates");
let csvtojson = require('csvtojson');
let propertiesreader = require('properties-reader');
let fs = require('fs');

let properties = propertiesreader('./test/test_cases/rfx.rates.properties.test.ini');

describe('rfx-rates', () => {
    describe('poll RFX Rate API OK', () =>  {
        it('should return HTTP code 200 and no error message', (done) => {
            fs.readFile('./test/test_cases/rfx-rates-test-ok.dat', (err, data) => {
                let tzoffset = (new Date()).getTimezoneOffset() * 60000;
                let localISOString = (new Date(Date.now() - tzoffset)).toISOString();
                let mockResBody = data.toString().replace(/updateDateTime/g, localISOString.replace(/[-T:Z.]/g,''));

                nock('https://' + properties.path().rfx.rates.poll.hostname)
                .get(properties.path().rfx.rates.poll.path)
                .reply(200, mockResBody)

                rfxrates.poll(properties, (result) => {
                    assert.equal(result.statusCode, 200);
                    assert.equal(result.message.errors.length, 0);
                    done();
                })
            });
        });
    });

    describe('poll RFX Rate API Not Found', () =>  {
        it('should return HTTP code 404 and a error message', (done) => {
            nock('https://' + properties.path().rfx.rates.poll.hostname)
            .get(properties.path().rfx.rates.poll.path)
            .reply(404)

            rfxrates.poll(properties, (result) => {
                assert.equal(result.statusCode, 404);
                assert.equal(result.message.errors.length, 1);
                assert(result.message.errors[0].error.includes('Unable to call the RFX Rates API'));
                done();
            })
        });
    });

    describe('poll RFX Rate API error', () =>  {
        it('should return HTTP code 500 and a error message', (done) => {
            let errMsg = 'Test Error Message';

            nock('https://' + properties.path().rfx.rates.poll.hostname)
            .get(properties.path().rfx.rates.poll.path)
            .replyWithError(errMsg);

            rfxrates.poll(properties, (result) => {
                assert.equal(result.statusCode, 500);
                assert.equal(result.message.errors.length, 1);
                assert.equal(result.message.errors[0].error, 'Unable to call the RFX Rates API: ' + errMsg);
                done();
            })
        });
    });
    
    describe('poll RFX Rate API delay', () =>  {
        it('should return HTTP code 500 and a error message per currency', (done) => {
            fs.readFile('./test/test_cases/rfx-rates-test-ok.dat', (err, data) => {
                let tzoffset = (new Date()).getTimezoneOffset() * 60000;
                let localISOString = (new Date(Date.now())).toISOString();
                let mockResBody = data.toString().replace(/updateDateTime/g, localISOString.replace(/[-T:Z.]/g,''));
                
                nock('https://' + properties.path().rfx.rates.poll.hostname)
                .get(properties.path().rfx.rates.poll.path)
                .reply(200, mockResBody)

                rfxrates.poll(properties, (result) => {
                    assert.equal(result.statusCode, 500);
                    // number of currency pairs in rfx.rates.properties.ini
                    assert.equal(result.message.errors.length, 40);
                    for (let i = 0; i < 40; i++) {
                        assert(result.message.errors[i].currency != null);
                        assert(result.message.errors[i].delay >= tzoffset);
                    }
                    done();
                })
            });
        });
    });

    describe('poll RFX Rate API missing last update date/time', () =>  {
        it('should return HTTP code 500 and a error message per currency', (done) => {
            fs.readFile('./test/test_cases/rfx-rates-test-ok.dat', (err, data) => {
                let mockResBody = data.toString().replace(/updateDateTime/g, '');
                
                nock('https://' + properties.path().rfx.rates.poll.hostname)
                .get(properties.path().rfx.rates.poll.path)
                .reply(200, mockResBody)

                rfxrates.poll(properties, (result) => {
                    assert.equal(result.statusCode, 500);
                    // number of currency pairs in rfx.rates.properties.ini
                    assert.equal(result.message.errors.length, 40);

                    csvtojson({delimiter: "\t", noheader: true})
                    .fromString(mockResBody)
                    .then((payload) => {
                        for (let i = 0; i < 40; i++) {
                            assert(result.message.errors[i].currency != null);
                            assert.equal(result.message.errors[i].error, 'Unable to find the last updated date/time');
                            assert.equal(result.message.errors[i].payload, JSON.stringify(payload[i+2]));
                        }
                        done();
                    })
                })
            });
        });
    });

});