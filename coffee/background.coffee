
class Background

	constructor: ->
		# Initialize ourself
		$( => @init() )


	init: ->
		# Register handlers
		#$('.capture').click () => @startCapture()
		console.log 'Initializing..'
		@startCapture()


	startCapture: ->
		embedString = '<embed width=0 height=0 src="pnacl/manifest.nmf" ps_tty_prefix="ps:" ps_stdout="/dev/tty" ps_stderr="/dev/tty" type="application/x-nacl" />'
		embedDiv = $('<div />').appendTo 'body'

		# Register our event listeners, then embed it
		embedDiv[0].addEventListener 'load', () => @handleLoad()
		embedDiv.on 'load', () => @handleLoad()
		embedDiv[0].addEventListener 'error', () => @handleError()
		embedDiv.on 'error', () => @handleError()
		embedDiv[0].addEventListener 'message', () => @handleMessage()
		embedDiv.on 'message', () => @handleMessage()

		embedDiv.html embedString


	handleLoad: ->
		console.log 'Loaded!!'


	handleError: ->
		console.log 'Error!!'


	handleMessage: ->
		console.log 'Message!!'


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