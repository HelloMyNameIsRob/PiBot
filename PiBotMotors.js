'use strict';

function PiBotMotors() {
    const PiBotBean = require('./PiBotBean');

    const Directions = {
        Stop: 0x00,
        Forward: 0x01,
        Reverse: 0x02,
        TurnRight: 0x03,
        TurnLeft: 0x04
    };
    var motorState = {
        left_speed: 0,
        right_speed: 0,
        direction: Directions.Stop
    };

    var _interface = {
        initialize: function() {
            console.log('Initializing PiBotMotors...');
            PiBotBean.initialize(function(response){
                if(response.success) {
                    console.log('PiBotMotors Initialized');
                } else {
                    console.log(`Error initializing PiBotMotors: ${response.error}`);
                }
            });
        },
        close: function() {
            PiBotBean.close();
        },
        setMotorState: function(cb, left_speed, right_speed, direction) {
            var response = { success: true };
            if(left_speed) {
                motorState.left_speed = left_speed;
            }
            if(right_speed) {
                motorState.right_speed = right_speed;
            }
            if(direction) {
                motorState.direction = Directions[direction];
            }

            if(PiBotBean.connected()) {
                var buffer = Buffer.from([motorState.left_speed, motorState.right_speed, motorState.direction]);
                PiBotBean.sendData(function (err) {
                    if(err) {
                        response.success = false;
                        response.error = err;
                        if(typeof cb === 'function') {
                            cb (response);
                        }
                    }
                }, buffer);
            } else if(typeof cb === 'function') {
                response.success = false;
                response.error = 'Bean not connected.';
                cb (response);
            }

        }
    };
    return _interface;
}

module.exports = PiBotMotors();