'use strict';

function PiJpegStream() {
    const express = require('express');
    const spawn = require('child_process').spawn;
    const path = require('path');
    const fs = require('fs');
    const PubSub = require('pubsub-js');
    const chokidar = require('chokidar');

    var boundaryID = "BOUNDARY";
    var process;
    var watcher;

    var image_path = path.join(__dirname, 'stream');
    var image_filename = 'image_stream.jpg';
    var image_file_path = path.join(image_path, image_filename);

    function startStreaming() {
        console.log('startStreaming...' + (process ? ' already streaming' : 'starting stream'));
        if (process) {
            return;
        }

        var args = ["-w", "320", "-h", "180", "-o", image_file_path, "-t", "0", "-tl", "100", '--rotation', '90', '--nopreview', '--quality', '50'];
        process = spawn('raspistill', args, {detached: true});
        process.on('error', (error) => {
            console.log(`raspistill error: ${error}`);
            process = null;
        });
        process.on('close', (code) => {
            console.log(`raspistill closed: ${code}`);
            process = null;
        });
        console.log('PiJpegServer image stream started...');
    }
    function stopStreaming() {
        streaming = false;
        if (watcher) {
            watcher.close();
            watcher = null;
        }
        if (process) {
            process.kill();
            process = null;
        }
        console.log('PiJpegServer image stream stopped.');
    }
    var _interface = {
        startServer: function(app, web_socket_port) {
            app.get('/PiBot/stream', function(req, res){
                res.writeHead(200, {
                    'Content-Type': 'multipart/x-mixed-replace;boundary="' + boundaryID + '"',
                    'Connection': 'keep-alive',
                    'Expires': 'Fri, 27 May 1977 00:00:00 GMT',
                    'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
                    'Pragma': 'no-cache'
                });

                var subscriber_token = PubSub.subscribe('MJPEG', function(msg, data) {
                    res.write('--' + boundaryID + '\r\n')
                    res.write('Content-Type: image/jpeg\r\n');
                    res.write('Content-Length: ' + data.length + '\r\n');
                    res.write("\r\n");
                    res.write(Buffer(data), 'binary');
                    res.write("\r\n");
                });
                res.on('close', function() {
                    console.log("Connection closed!");
                    PubSub.unsubscribe(subscriber_token);
                    res.end();
                });
            });

            watcher = chokidar.watch(image_file_path, {
                persistent: true,
                usePolling: true,
                interval: 10,
            });
            watcher.on('change', function(file) {
                fs.readFile(file, function(err, imageData) {
                    if (!err) {
                        PubSub.publish('MJPEG', imageData);
                    }
                    else {
                        console.log(err);
                    }
                });
            });
            startStreaming();
        },
        stopServer: function() {
            stopStreaming();
            socket_server.close();
            console.log('PiJpegStream stopped.');
        }
    };
    return _interface;
}

module.exports = PiJpegStream();