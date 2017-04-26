'use strict';

function PiBotBean() {
    const Bean = require('ble-bean');
    const async = require('async');

    var tried_to_exit = false;
    var connected_bean;

    function connectToBean(cb) {
        var bean;
        async.series([
            function(callback){
                var error = null;
                Bean.discover(function(_bean) {
                    console.log(`Discovered Bean: ${bean}`);
                    bean = _bean;
                    if(!bean) {
                        error = 'No beans discovered.';
                    }
                    callback(error);
                });
            }, function (callback) {
                bean.connectAndSetup (function(err){
                    if(!err) {
                        console.log('Bean Connected!');
                        connected_bean = bean;
                        bean.on("serial", function(data, valid){
                            console.log(data.toString());
                        });
                        bean.on('close', function(){
                            connected_bean = null;
                        });
                    } else {
                        console.log(`Error setting up bean: ${err}`);
                    }
                    callback(err);
                });
            }
        ], function(err){
            if(typeof cb === 'function') {
                if(err) {
                    cb({success: false, error: err});
                } else {
                    cb ({success: true, bean: bean});
                }
            }
        });
    }

    return {
        initialize: function(cb) {
            connectToBean(cb);
        },
        connected: function() {
            return connected_bean !== null;
        },
        close: function(){
            if (connected_bean && !tried_to_exit) {
                tried_to_exit = true;
                console.log('Turning off led...');
                connected_bean.setColor(new Buffer([0x0,0x0,0x0]), function(){});
                //no way to know if succesful but often behind other commands going out, so just wait 2 seconds
                console.log('Disconnecting from Device...');
                setTimeout(connected_bean.disconnect.bind(connected_bean, function(){}), 2000);
            }
        },
        sendData: function(cb, data) {
            if(!connected_bean) {
                if(typeof cb === 'function') {
                    cb ({success: false, error: 'Bean not connected.'});
                }
            } else {
                connected_bean.write(data, function (err) {
                    if(typeof cb === 'function') {
                        if(err) {
                            cb({success: false, error: err});
                        } else {
                            cb({success: true});
                        }
                    }
                });

            }
        }
    };
}

module.exports = PiBotBean();