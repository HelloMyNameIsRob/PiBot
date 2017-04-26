angular.module('PiBot.PiSocket', [])
    .factory('PiSocket', ['$q', '$rootScope', function($q, $rootScope) {
        // We return this object to anything injecting our service
        var Service = {};
        // Keep all pending requests here until they get responses
        var callbacks = {};
        // Create a unique callback ID to map requests to responses
        var currentCallbackId = 0;
        // Create our websocket object with the address to the websocket
        var ws = null;

        Service.open = function (address, open_cb, close_cb) {
            ws && ws.close();
            ws = new WebSocket(address);
            ws.onopen = open_cb;
            ws.onclose = close_cb;
            ws.onmessage = function (message) {
                listener(JSON.parse(message.data));
            };
        };
        Service.close = function() {
            ws && ws.close();
        };

        function sendRequest(request) {
            var defer = $q.defer();
            var callbackId = getCallbackId();
            callbacks[callbackId] = {
                time: new Date(),
                cb: defer
            };
            request.callback_id = callbackId;
            ws.send(JSON.stringify(request));
            return defer.promise;
        }

        function listener(data) {
            var messageObj = data;
            // If an object exists with callback_id in our callbacks object, resolve it
            if (callbacks.hasOwnProperty(messageObj.callback_id)) {
                $rootScope.$apply(callbacks[messageObj.callback_id].cb.resolve(messageObj.data));
                delete callbacks[messageObj.callbackID];
            }
        }

        // This creates a new callback ID for a request
        function getCallbackId() {
            currentCallbackId += 1;
            if (currentCallbackId > 10000) {
                currentCallbackId = 0;
            }
            return currentCallbackId;
        }

        Service.Directions = [
            'Stop',
            'Forward',
            'Reverse',
            'TurnRight',
            'TurnLeft'
        ];
        // Define a "getter" for getting status
        Service.getGpioData = function () {
            var request = {
                action: "get_gpio_data"
            };
            return sendRequest(request);
        };
        Service.setGpioMode = function (pin, value) {
            var request = {
                action: "set_mode",
                data: {
                    pin: pin,
                    value: value
                }
            };
            return sendRequest(request);
        };
        Service.setPwmValue = function (pin, value) {
            var request = {
                action: "set_pwm_value",
                data: {
                    pin: pin,
                    value: value
                }
            };
            return sendRequest(request);
        };
        Service.setDigitalValue = function (pin, value) {
            var request = {
                action: "set_digital_value",
                data: {
                    pin: pin,
                    value: value
                }
            };
            return sendRequest(request);
        };
        Service.setServoValue = function (pin, value) {
            var request = {
                action: "set_servo_value",
                data: {
                    pin: pin,
                    value: value
                }
            };
            return sendRequest(request);
        };
        Service.setMotorState = function(left_speed, right_speed, direction) {
            var request = {
                action: "set_motor_state",
                data: {
                    left_speed: left_speed,
                    right_speed: right_speed,
                    direction: direction
                }
            };
            return sendRequest(request);
        };

        return Service;
    }]);
