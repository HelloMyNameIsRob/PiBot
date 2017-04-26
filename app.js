'use strict';

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const Gpio = require('pigpio').Gpio;
const app = express();
const GpioHelper = require('./GpioHelper');
const PiJpegStream = require('./PiJpegStream');
const PiBotMotors = require('./PiBotMotors');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

app.use('/PiBot', express.static('public/PiBotClient/app'));
app.use('/fonts', express.static('public/fonts'));

var data = GpioHelper.initGpio();
var gpioData = data.gpioData;
var gpioPins = data.gpioPins;


var exitHandler = function exitHandler() {
    PiJpegStream.stopServer();
    PiBotMotors.close();
};

var ws_actions = {
    set_mode: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins[request.pin];
        if(pin) {
            //console.log ("Setting mode of GPIO#" + request.pin + " to " + request.value)
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
        if(typeof callback === 'function') {
            callback(response);
        }
    },
    set_pwm_value: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins [request.pin];
        if (pin) {
            //console.log ("Setting PWM value of GPIO#" + request.pin + " to " + request.value);
            pin.pwmWrite(request.value);
            gpioData[request.pin].pwmValue = request.value;
            response.success = true;
            response.success = true;
            response.pin = request.pin;
            response.gpio_data = gpioData[request.pin];
        }
        if(typeof callback === 'function') {
            callback(response);
        }
    },
    set_digital_value: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins[request.pin];
        if(pin) {
            //console.log("Setting digital value of GPIO#" + request.pin + " to " + request.value);
            var value = request.value ? 1 : 0;
            pin.digitalWrite (value);
            gpioData[request.pin].digitalValue = value;
            response.success = true;
            response.pin = request.pin;
            response.gpio_data = gpioData[request.pin];
        }
        if(typeof callback === 'function') {
            callback(response);
        }
    },
    set_servo_value: function (request, callback) {
        var response = { success: false };
        var pin = gpioPins[request.pin];
        if(pin) {
            //console.log("Setting servo value of GPIO#" + request.pin + " to " + request.value);
            pin.servoWrite(request.value);
            gpioData[request.pin].servoValue = request.value;
            response.success = true;
            response.pin = request.pin;
            response.gpio_data = gpioData[request.pin];
        }
        if(typeof callback === 'function') {
            callback(response);
        }
    },
    get_gpio_data: function (request, callback) {
        var response = { success: false };
        if (Gpio) {
            response.success = true;
            response.gpio = gpioData;
        }
        if(typeof callback === 'function') {
            callback(response);
        }
    },
    set_motor_state: function (request, callback) {
        PiBotMotors.setMotorState(function(response){
            if(typeof callback === 'function'){
                callback(response);
            }
        }, request.left_speed, request.right_speed, request.direction);
    }
};

PiJpegStream.startServer(app);
PiBotMotors.initialize();

server.listen(3000);
console.log ("Listening on port 3000");


wss.connectionCount = 0;
wss.on('connection', function connection(ws) {
    wss.connectionCount++;

    const location = url.parse(ws.upgradeReq.url, true);

    ws.on('message', function incoming(message) {
        //console.log("WebSocket received: " + message);
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

process.on('SIGINT', exitHandler.bind(this));

