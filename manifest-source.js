(function (global) {
  'use strict';

  var productionOrigin = 'https://hetoandrade.com.br/';

  function manifestUrl(fileName) {
    if (global.location && global.location.protocol === 'file:') {
      return new URL(fileName, productionOrigin).href;
    }

    return fileName;
  }

  global.HetoandradeSite = global.HetoandradeSite || {};
  global.HetoandradeSite.manifestUrl = manifestUrl;
})(window);
