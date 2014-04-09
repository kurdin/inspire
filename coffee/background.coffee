angular.module("inspire.app", ["castly.bgRecord", "castly.bgUpload", "w69b.chromePersistentLogger"]).run(["bgRecordService", "bgUploadService", "analytics", "$log", "chromePersistentLogger", 
(bgRecord, bgUpload, logger) ->

	class Background

		nativeDiv: null
		encoder: null
		videoElement: null


		constructor: ->
			# Initialize ourself
			$( => @init() )


		init: ->
			# Register handlers
			#$('.capture').click () => @startCapture()
			console.log 'Initializing..'
			@startCapture()


		startCapture: ->
			###embedString = '<embed width=0 height=0 src="pnacl/manifest.nmf" ps_tty_prefix="ps:" ps_stdout="/dev/tty" ps_stderr="/dev/tty" type="application/x-nacl" />'
			embedDiv = $('<div />')

			# Register our event listeners, then embed it
			embedDiv[0].addEventListener 'load', (() => @handleLoad()), true
			embedDiv[0].addEventListener 'error', (() => @handleError()), true
			embedDiv[0].addEventListener 'crash', (() => @handleError()), true
			embedDiv[0].addEventListener 'message', ((msg) => @handleMessage(msg)), true

			embedDiv[0].innerHTML = embedString
			embedDiv.appendTo 'body'

			@encoder = embedDiv[0].children[0]###
			bgRecord.start()


		handleLoad: ->
			console.log 'Loaded native encoder.'
			@sendFrame()


		handleError: ->
			console.log 'Error.'


		handleCrash: ->
			console.log 'Crash.'


		handleMessage: (msg) ->
			console.log "Message: #{msg.data}" 


		sendFrame: ->
			


		setupScreenCapture: ->
			# Initialize our screen capture method
			videoElement = document.createElement 'video'
			videoElement.src = 
			videoElement.play()




	# Execute
	new Background()

	###chrome.app.runtime.onLaunched.addListener(function(launchData) {
	  alert('opened');
	});

	chrome.runtime.onInstalled.addListener(function() {
	  console.log('installed');
	});

	chrome.runtime.onSuspend.addListener(function() { 
	  // Do some simple clean-up tasks.
	});
	###

]);


bootstrap = () ->
  a = document.createElement "div"
  document.body.appendChild(a)

  angular.bootstrap a, ["inspire.app"]

bootstrap()