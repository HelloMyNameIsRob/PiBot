'use strict';

angular.module('PiBot.PiTestView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/PiTest', {
    templateUrl: 'PiTestView/PiTest_view.html',
    controller: 'PiTestCtrl',
    controllerAs: "ctrl"
  });
}])

.controller('PiTestCtrl', ['$scope', '$location', '$document', 'PiSocket', function($scope, $location, $document, PiSocket) {
  this.wsData = {
      connected: false,
      url: "ws://" + $location.host() + ":" + $location.port() + "/pibot/socket"
  };
  this.videoUrl = $location.protocol () + "://" + $location.host () + ":" + 8081;

  this.gpio_pins = {};
  this.pin_states = {};
  this.servoMin = 590;
  this.servoMax = 2300;
  var self = this;

  this.getPinFunctions = function() {
      return [
          "Digital",
          "PWM",
          "Servo"
      ];
  };
  this.getPinModes = function() {
      return [
          "INPUT",
          "OUTPUT",
          "ALT0",
          "ALT1",
          "ALT2",
          "ALT3",
          "ALT4",
          "ALT5"
      ];
  };

  this.gpioPins = function(){
      return $scope.gpio_pins;
  };

  var updatePins = function () {
      PiSocket.getGpioData().then(function (result){
          if (result.success) {
              self.gpio_pins = result.gpio;
          } else {
              self.gpio_pins = {};
          }
      });
  };

  this.connect = function (url){
    PiSocket.open(url, function() {
      self.wsData.connected = true;
      updatePins ();
      $scope.$apply();
    }, function () {
      self.wsData.connected = false;
      $scope.$apply();
    });
  };

  this.disconnect = function() {
    PiSocket.close();
  };

  this.setPwmValue = function(pin, value) {
    var response = PiSocket.setPwmValue(pin, value).then (function(response) {
        if (response.success) {
            self.gpio_pins[response.pin] = response.gpio_data;
        }
    });
  };

  this.setDigitalValue = function(pin, value) {
    var response = PiSocket.setDigitalValue(pin, value).then (function (response) {
        if (response.success) {
            self.gpio_pins[response.pin] = response.gpio_data;
        }
    });
  };

  this.setGpioMode = function(pin, value) {
    PiSocket.setGpioMode(pin, value).then (function (response){
        if (response.success) {
            self.gpio_pins[response.pin] = response.gpio_data;
        }
    });
  };

  this.setServoValue = function(pin, value) {
      PiSocket.setServoValue(pin, value).then (function (response) {
          if(response.success) {
              self.gpio_pins[response.pin] = response.gpio_data;
          }
      });
  };
}])
.directive('videoPlayer', ['$location', function($location){
    var player = null;
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var url = 'ws://' + $location.host() + ':8082/PiCam';
            player = new JSMpeg.Player(url, {canvas: element[0], autoplay: true});
        }
    };
}]);