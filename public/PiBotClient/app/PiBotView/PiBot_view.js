'use strict';

angular.module('PiBot.PiBotView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/PiBotView', {
      templateUrl: 'PiBotView/PiBot_view.html',
      controller: 'PiBotCtrl',
      controllerAs: "ctrl"
  });
}])

.controller('PiBotCtrl', ['$scope', '$location', 'PiSocket', function($scope, $location, PiSocket) {
    var self = this;
    this.piSocket = PiSocket;
    this.servoMin = 590;
    this.servoMax = 2300;
    this.servoMid = ((this.servoMax - this.servoMin) / 2) + this.servoMin;
    this.tiltValue = this.servoMid;
    this.panValue = this.servoMid;
    this.servosEnabled = false;
    var panPin = 22;
    var tiltPin = 27;

    this.wsData = {
        connected: false,
        url: "ws://" + $location.host() + ":" + $location.port() + "/pibot/socket"
    };
    this.motorState = {
        left_speed: 0,
        right_speed: 0,
        direction: PiSocket.Directions.Stop
    };

    function connect(url){
        PiSocket.open(url, function() {
            self.wsData.connected = true;
            self.panValue = self.servoMid;
            self.tiltValue = self.servoMid;
            self.servosEnabled = false;
            self.setPan(0);
            self.setTilt(0);
            self.piSocket.setGpioMode(panPin, "OUTPUT");
            self.piSocket.setGpioMode(tiltPin, "OUTPUT");
            $scope.$apply();
        }, function () {
            self.wsData.connected = false;
            $scope.$apply();
        });
    }

    function sendMotorState(){
        self.piSocket.setMotorState(self.motorState.left_speed, self.motorState.right_speed, self.motorState.direction);
    }

    this.init = function (){
      connect(this.wsData.url);
    };

    this.setServosEnabled = function(enabled) {
        self.servosEnabled = enabled;
        if (enabled){
            self.setPan(self.panValue);
            self.setTilt(self.tiltValue);
        } else {
            self.setPan(0);
            self.setTilt(0);
        }
    };
    this.setMotorState = function (motorState) {
      sendMotorState();
    };

    this.setMotorDirection = function(direction) {
        this.motorState.direction = direction;
        sendMotorState();
    };

    this.setPan = function(value) {
        self.piSocket.setServoValue(panPin, value);
    };

    this.setTilt = function(value) {
        self.piSocket.setServoValue(tiltPin, value);
    };
    
    this.init();
}]);