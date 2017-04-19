'use strict';

angular.module('PiBot.PiBotView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/PiBotView', {
    templateUrl: 'PiBotView/PiBot_view.html',
    controller: 'PiBotCtrl'
  });
}])

.controller('PiBotCtrl', [function() {


}]);