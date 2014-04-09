'use strict';

// Copyright 2013 Manuel Braun (mb@w69b.com). All Rights Reserved.
console.log('loaded event page');

/*function load(cmd) {
  var url = 'background.html';
  if (cmd) url += '?cmd=' + cmd;
  window.location.href = url;
}

function onMessage(request, sender, sendResponse) {
  if (request === 'loadBackground') {
    load();
  } else {
    console.debug('did not handle message ' + request);
    sendResponse();
  }
}

chrome.runtime.onMessage.addListener(onMessage);

// load real page if there are pending uplaods.
chrome.storage.local.get('uploadsPending', function(map) {
  if (map && map.uploadsPending && Object.keys(map.uploadsPending).length)
    load();
});

chrome.commands.onCommand.addListener(function(command) {
  load(command);
});*/