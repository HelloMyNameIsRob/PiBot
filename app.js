'use strict';

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const Gpio = require('pigpio').Gpio;
const app = express();
const GpioHelper = require('./GpioHelper');
//const PiCamStream = require('./PiCamStream');
const PiCamServer = require('./PiCamServer');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

app.use('/PiBot', express.static('public/PiBotClient/app'));

var data = GpioHelper.initGpio();
var gpioData = data.gpioData;
var gpioPins = data.gpioPins;

// for (var key in data.gpioData) {
//     // skip loop if the property is from prototype
//     if (!data.gpioData.hasOwnProperty(key)) continue;
//
//     var obj = data.gpioData[key];
//     console.log("GPIO#" + key
//         + "\n  mode=" + obj.mode
//         + "\n  digitalValue=" + obj.digitalValue
//         + "\n  pwmValue=" + obj.pwmValue
//         + "\n  pwmRange=" + obj.pwmRange);
// }

var ws_actions = {
    set_mode: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins[request.pin];
        if(pin) {
            console.log ("Setting mode of GPIO#" + request.pin + " to " + request.value)
            var mode = GpioHelper.gpioModeToInt(request.value);
            try {
                pin.mode(mode);
                gpioData[request.pin].mode = request.value;
                response.success = true;
                response.pin = request.pin;
                response.gpio_data = gpioData[request.pin];
            } catch (exception) {
                response.err = "Invalid mode: " + request.mode + "\n" + exception;
            }
        }
        callback && callback(response);
    },
    set_pwm_value: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins [request.pin];
        if (pin) {
            console.log ("Setting PWM value of GPIO#" + request.pin + " to " + request.value);
            pin.pwmWrite(request.value);
            gpioData[request.pin].pwmValue = request.value;
            response.success = true;
            response.success = true;
            response.pin = request.pin;
            response.gpio_data = gpioData[request.pin];
        }
        callback && callback (response);
    },
    set_digital_value: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins[request.pin];
        if(pin) {
            console.log("Setting digital value of GPIO#" + request.pin + " to " + request.value);
            var value = request.value ? 1 : 0;
            pin.digitalWrite (value);
            gpioData[request.pin].digitalValue = value;
            response.success = true;
            response.pin = request.pin;
            response.gpio_data = gpioData[request.pin];
        }
        callback && callback (response);
    },
    set_servo_value: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins[request.pin];
        if(pin) {
            console.log("Setting servo value of GPIO#" + request.pin + " to " + request.value);
            pin.servoWrite(request.value);
            gpioData[request.pin].servoValue = request.value;
            response.success = true;
            response.pin = request.pin;
            response.gpio_data = gpioData[request.pin];
        }
        callback && callback (response);
    },
    get_gpio_data: function (request, callback) {
        var response = { success: false };
        if (Gpio) {
            response.success = true;
            response.gpio = gpioData;
        }
        callback && callback (response);
    }
};

server.listen(3000);
console.log ("Listening on port 3000");

PiCamServer.start();

wss.connectionCount = 0;
wss.on('connection', function connection(ws) {
    wss.connectionCount++;

    const location = url.parse(ws.upgradeReq.url, true);
    console.log('Web Socket Connected: ', location);
    // You might use location.query.access_token to authenticate or share sessions
    // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    ws.on('message', function incoming(message) {
        console.log("WebSocket received: " + message);
        message = JSON.parse(message);
        if (!(message.action in ws_actions)) {
            console.log ("Action not valid: " + message.action);
        } else {
            ws_actions [message.action] (message.data, function(data){
                var response = {
                    callback_id: message.callback_id,
                    data: data
                };
                ws.send (JSON.stringify(response));
            });
        }
    });
    ws.on('close', function(code, message){
        wss.connectionCount--;
    });

    ws.send(JSON.stringify({data: 'something'}));
});

