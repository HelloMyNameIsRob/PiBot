'use strict';

// Declare app level module which depends on views, and components
angular.module('PiBot', [
  'ngRoute',
  'PiBot.PiBotView',
  'PiBot.PiTestView',
  'PiBot.version',
  'PiBot.PiSocket'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/PiBotView'});
}]);
