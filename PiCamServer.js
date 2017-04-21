// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay yoursecret 8081 8082
// ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret


function PiCamServer() {
    'use strict';

    var http = require('http');
    var WebSocket = require('ws');
    var fs = require('fs');
    var spawn = require('child_process').spawn;

    var WEB_SOCKET_PORT = 8082;
    var STREAM_PORT = 8081;
    var STREAM_SECRET = 'PiCam';
    var RECORD_STREAM = false;
    var started = false;
    var socketServer = null;
    var streamServer = null;
    var videoStream = null;

    var startSocketServer = function (web_socket_port) {
        if(web_socket_port) { WEB_SOCKET_PORT = web_socket_port; }
        // Websocket Server
        socketServer = new WebSocket.Server({port: WEB_SOCKET_PORT, perMessageDeflate: false});
        socketServer.connectionCount = 0;
        socketServer.on('connection', function (socket) {
            socketServer.connectionCount++;
            console.log(
                'New WebSocket Connection: ',
                socket.upgradeReq.socket.remoteAddress,
                socket.upgradeReq.headers['user-agent'],
                '(' + socketServer.connectionCount + ' total)'
            );
            socket.on('close', function (code, message) {
                socketServer.connectionCount--;
                console.log(
                    'Disconnected WebSocket (' + socketServer.connectionCount + ' total)'
                );
            });
        });
        socketServer.broadcast = function (data) {
            socketServer.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        };
        console.log('Awaiting WebSocket connections on ws://localhost:' + WEB_SOCKET_PORT + '/');
    };
    var startStreamServer = function (stream_port, stream_secret){
        if(stream_port) { STREAM_PORT = stream_port; }
        if(stream_secret) { STREAM_SECRET = stream_secret; }

        // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
        streamServer = http.createServer(function (request, response) {
            var params = request.url.substr(1).split('/');

            if (params[0] !== STREAM_SECRET) {
                console.log(
                    'Failed Stream Connection: ' + request.socket.remoteAddress + ':' +
                    request.socket.remotePort + ' - wrong secret.'
                );
                response.end();
            }

            response.connection.setTimeout(0);
            console.log(
                'Stream Connected: ' +
                request.socket.remoteAddress + ':' +
                request.socket.remotePort
            );
            request.on('data', function (data) {
                socketServer.broadcast(data);
                if (request.socket.recording) {
                    request.socket.recording.write(data);
                }
            });
            request.on('end', function () {
                console.log('close');
                if (request.socket.recording) {
                    request.socket.recording.close();
                }
            });

            // Record the stream to a local file?
            if (RECORD_STREAM) {
                var path = 'recordings/' + Date.now() + '.ts';
                request.socket.recording = fs.createWriteStream(path);
            }
        }).listen(STREAM_PORT);
        console.log('Listening for incomming MPEG-TS Stream on http://localhost:' + STREAM_PORT + '/<secret>');
    };
    var startVideoStream = function() {
        var command = 'avconv -f video4linux2 -framerate 20 -video_size 320x180 -i /dev/video0 -f mpegts -codec:v mpeg1video -s 320x180 -b:v 400k -bf 0' +
            ' http://localhost:' + STREAM_PORT + '/' + STREAM_SECRET;
        // videoStream = spawn('avconv', [
        //     '-f', 'video4linux2', '-framerate', '20', '-video_size', '320x180',
        //     '-i', '/dev/video0', '-f', 'mpegts', '-codec:v', 'mpeg1video',
        //     '-s', '320x180', '-b:v', '800k', '-bf', '0',
        //     'http://localhost:' + STREAM_PORT + '/' + STREAM_SECRET
        // ], {detached: true});
        videoStream = spawn('sh', ['-c', command]);
        videoStream.on('error', function (err) {
            console.log('avconv error: ' + err);
        });

        console.log(`Video stream running pid: ${videoStream.pid}`);
    };


    var _interface = {
        start: function(web_socket_port, stream_server_port, stream_secret){
            started = true;
            startSocketServer(web_socket_port);
            startStreamServer(stream_server_port);
            startVideoStream();

            videoStream.on('close', (code) => {
                if(started){
                    console.log (`avconv close: ${code}\nRestarting...`);
                    startVideoStream();
                } else {
                    console.log (`avconv close: ${code}`);
                }
            });
        },
        stop: function(){
            started = false;
            videoStream && videoStream.kill ();
            streamServer && streamServer.close();
            socketServer && socketServer.close();

            videoStream = null;
            streamServer = null;
            socketServer = null;
        }
    };
    return _interface;



}

module.exports = PiCamServer();