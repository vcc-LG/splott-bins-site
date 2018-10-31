const express = require('express');
const app = express();
var request = require('request');
var soap = require('soap');
var Promise = require('promise');
var exphbs = require('express-handlebars');
var moment = require('moment');

app.use(express.static('public'));
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');


function get_headers(access_token) {
    var headers = {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json; charset=UTF-8',
    };
    return headers
}

var dataString = '{"systemReference":"web","language":"eng","uprn":100100065776}';

function get_access_promise() {
    var p = new Promise(function(resolve, reject) {
        var soap_args = {
            "GetJWT": {
                "-xmlns": "http://tempuri.org/"
            }
        };
        var soap_url = 'https://authwebservice.cardiff.gov.uk/AuthenticationWebService.asmx?wsdl';
        soap.createClient(soap_url, function(err, soapClient) {
            soapClient.GetJWT({
                xmlns: "http://tempuri.org/"
            }, function(err, result) {
                var token = JSON.parse(result.GetJWTResult).access_token;
                resolve(token);
            });
        });
    })
    return p;
};

function get_access_token() {
    var soap_args = {
        "GetJWT": {
            "-xmlns": "http://tempuri.org/"
        }
    };
    var soap_url = 'https://authwebservice.cardiff.gov.uk/AuthenticationWebService.asmx?wsdl';
    soap.createClient(soap_url, function(err, soapClient) {
        soapClient.GetJWT({
            xmlns: "http://tempuri.org/"
        }, function(err, result) {
            var token = JSON.parse(result.GetJWTResult).access_token;
            //console.log(token);
            return token;
        });
    });
};

function process_raw_data(raw_data) {
    var myArr = [];
    raw_data.collectionWeeks.forEach(function(el) {
        var tempDict = {};
        console.log(el);
        tempDict['date_formatted'] = moment(el.date).format('dddd MMMM Do YYYY');
        //console.log(tempDict['date_formatted'] );
        tempDict['date_day_before_formatted'] = moment(el.date).subtract(1, "days").format('dddd MMMM Do YYYY');
        tempDict['bins'] = [];
        el.bins.forEach(function(bin) {
            tempDict['bins'].push(bin.type)
        });
        myArr.push(tempDict);
    });
  console.log(myArr);
  return myArr;
}


app.get('/', function(req, res) {

    get_access_promise().then(function(token) {
        var headers = get_headers(token);
        var body = dataString;
        request.post({
                url: 'https://api.cardiff.gov.uk/WasteManagement/api/WasteCollection',
                headers: headers,
                body: body
            },
            function(err, httpResponse, body) {
                if (!err && httpResponse.statusCode == 200) {
                    //console.log(JSON.parse(body));
                    //process_raw_data(JSON.parse(body));
                    res.render('home', {
                        data: process_raw_data(JSON.parse(body))                    });
                } else {
                    res.render('error', {
                        msg: err
                    });
                }
            });
    });


});


const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
});