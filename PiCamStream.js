'use strict';

const http = require('http');
const ChildProcess = require('child_process');

function PiCamStream() {
    var running = false;
    var self = this;
    var streamServer = null;
    var avconv = null;

    const server = {
        isRunning: function () {
            return running;
        },
        startCameraStream: function (stream_port) {
            avconv = ChildProcess.spawn('avconv', [
                    '-s', '320x240',
                    '-f', 'video4linux2',
                    '-i', '/dev/video0',
                    '-f', 'mpeg1video',
                    '-b', '800k',
                    '-r', '30',
                    '-'],
                {detached: false});
            // avconv = ChildProcess.spawn("avconv", [
            //     "-i", '/dev/video0', "-vcodec", "copy", "-f", "mp4", "-movflags", "frag_keyframe+empty_moov",
            //     "-reset_timestamps", "1", "-vsync", "1","-flags", "global_header", "-bsf:v", "dump_extra", "-y", "-"   // output to stdout
            // ],  {detached: false});
            avconv.on('error', (err) => {
                console.log(`failed to spawn avconv: ${err}`);
            });
            running = true;
            console.log(`avconv started ${avconv.pid}`);
        },
        stopCameraStream: function () {
            if (avconv){
                avconv.kill();
                avconv = null;
            }
        },
        startServer: function (stream_port) {
            var STREAM_PORT = stream_port || 8081;
            var self = this;

            // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
            streamServer = http.createServer(function (request, response) {
                response.writeHead(200, {
                    //'Transfer-Encoding': 'binary'
                    "Connection": "keep-alive",
                    "Content-Type": "video/mp4",
                    //, 'Content-Length': chunksize            // ends after all bytes delivered
                    "Accept-Ranges": "bytes"                 // Helps Chrome
                });

                if (!avconv) {
                    self.startCameraStream();

                    avconv.stdout.pipe(response);

                    avconv.stdout.on("data",function(data) {
                        console.log("Data");
                    });

                    avconv.stderr.on("data", function (data) {
                        console.log("Error -> " + data);
                    });

                    avconv.on("exit", function (code) {
                        console.log("avconv terminated with code " + code);
                    });

                    avconv.on("error", function (e) {
                        console.log("avconv system error: " + e);
                    });
                }

                request.on("close", function () {
                    self.stopCameraStream();
                });

                request.on("end", function () {
                    self.stopCameraStream();
                });
            }).listen(STREAM_PORT, function() {
                console.log('Video stream listening on port ' + STREAM_PORT);
            });
        },
        stopServer: function () {
            streamServer.close ();
            console.log("PiCam Server Stopped.");
        }
    };

    return server;
}

module.exports = PiCamStream();