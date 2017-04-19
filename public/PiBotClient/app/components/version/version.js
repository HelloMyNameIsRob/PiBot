'use strict';

angular.module('PiBot.version', [
  'PiBot.version.interpolate-filter',
  'PiBot.version.version-directive'
])

.value('version', '0.1');
