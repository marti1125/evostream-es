jQuery(document).ready(function(){
	// old state of the command list
	var oldCmd = '';
	// hide/show animation duration
	var duration = 400;
	// flag to indicate that this is an auto IP config
	var autoIp = false;

	// List of available commands
	var addStream = 'addStream';
	var removeStream = 'removeStream';
	var createHLS = 'createHLS';
	var sendMpegTs = 'sendMpegTs';
	var listStream = 'listStream';

	// Assign handle for flowplayer
	var flowPlayer = $f("videoContainer", "swf/flowplayer-3.2.11.swf");

	if (autoIp) {
		// Save the IP
		$('#ipAddress').val(document.domain);

		// Auto connect to server
		autoConnect();
	}

	function autoConnect() {
		var ip = getIp();

		$.ajax({
			type:'POST',
			url:'php/evoapi-uiproxy.php',
			data:'ip=' + ip,
			dataType:'json',
			async:true,
			error: function(json, status){
				showAjaxErr(status);
			},
			success:function(json){
				if(json.connected) {
					// Show the command list
					connStatus(false);

					// Retrieve the list of streams
					processListStream(true);
				} else {
					// Hide the command list
					connStatus(true);

					// Otherwise show an error
					showStatus(true, 'No se puede conectar a ' + ip + '!' + ((null == json.description)? '' : json.description));
				}
			}
		});
	}

	// Display error or success status messages
	function showStatus(isErr, msg) {
		var statMsg = '';

		// Create the status display
		if (isErr) {
			statMsg = '<div class="notice error"><span class="icon" data-icon="x"></span>' + msg + ' <a href="#close" class="icon close" data-icon="x"></a></div>';
		} else {
			statMsg = '<div class="notice success"><span class="icon" data-icon="C"></span>' + msg + ' <a href="#close" class="icon close" data-icon="x"></a></div>';
		}

		// Update the DIV container of the status
		$('#statusMessage').html(statMsg);

		// Rerun the html kick start script for newly created html tags
		doKickStart();
	}

	// Create detailed error reporting of AJAX error
	function showAjaxErr(err) {
		var errMsg = 'No se puede cargar los scripts PHP!';

		// Compose error message depending on ajax error
		switch (err) {
			case 'error':
				errMsg = 'El servidor web no esta disponible <br /> Aseg&uacute;rese de que el servidor web se esta ejecutando y no se encuentra colgado/apagado.';

				break;
			case 'parsererror':
				errMsg = 'No esta instalado el PHP en el servidor web <br /> Instalelo y reinicie.';

				break;
			case 'timeout':
				errMsg = 'El servidor web se demora en responder... <br /> Al parecer hay un problema de conexici&oacute;n, intentelo de nuevo.';

				break;
			case 'abort':
				errMsg = 'El pedido de conexi&oacute;n a sido denegado';

				break;
			default:

		}

		// Display the error
		showStatus(true, errMsg);
	}

	// Show messages depending on the type of command
	function setCmdMsgs(cmd, msg) {
		var notice = '';

		// Determine the type of command
		switch (cmd) {
			case removeStream:
				notice = '#remNotice';

				break;
			case createHLS:
				notice = '#hlsNotice';

				break;
			case sendMpegTs:
				notice = '#mpgNotice';

				break;
			default:
				break;
		}

		$(notice).html(msg);
	}

	// Enable or disable a command button
	function setCmdButton(cmd, isEnabled) {
		var button = '';

		// Determine the type of command
		switch (cmd) {
			case addStream:
				button = '#cmdAddButton';
				break;
			case removeStream:
				button = '#cmdRemButton';
				break;
			case createHLS:
				button = '#cmdHlsButton';
				break;
			case sendMpegTs:
				button = '#cmdSendMpgButton';
				break;
			default:
				break;
		}

		$(button).attr('disabled', !isEnabled);

		if (isEnabled) {
			// Remove the 'disabled' class
			if ($(button).hasClass('disabled')) $(button).removeClass('disabled');
		} else {
			// Add a 'disabled' class for each
			$(button + 'not(.disabled)').addClass('disabled');
		}

	}

	// Display or hides items depending on connection status
	function connStatus(isErr) {
		if (isErr) {
			$('#serverComandContainer').hide();
			$('#streamList').hide();
			$('#streamDetail').hide();
			$('#videoContainer').hide();
			$('#cmdAdd').hide();
			$('#cmdRemove').hide();
			$('#cmdHLS').hide();
			$('#cmdMpegSend').hide();
		} else {
			$('#serverComandContainer').show(duration);
			$('#streamList').show(duration);
		}
	}

	// Returns the IP address of EMS
	function getIp() {
		return $('#ipAddress').val();
	}

	// Returns the name of currently selected stream
	function getCurrentStream() {
		return $('#nameSrc').val();
	}

	// Returns the active server command
	function getCurrentCmd() {
		return $('#commandList').val();
	}

	// Checks the IP address of the EMS if valid
	function checkIp() {
		if (autoIp) return true;

		var ip = getIp();

		if(ip.toString().length > 0 && /^[0-9]{1,3}[.][0-9]{1,3}[.][0-9]{1,3}[.][0-9]{1,3}$/i.test(ip)) {
			return true;
		} else {
			// Considered as connection error
			connStatus(true);

			// Invalid IP
			showStatus(true, 'Direcci&oacute;n IP inv&aacute;lida <br /> Si el SCSS se encuentra en la maquina actual, trate con "127.0.0.1".');

			return false;
		}
	}

	// Repopulate the list of streams
	function updateList(tbody) {
		// Create the HTML table with the list of streams
		var table = '<h6>Lista de Streams</h6><div id="streamListDiv"><table id="streamListTable" class="striped sortable" cellspacing="0" cellpadding="0"><thead><tr><th>ID</th><th>Name</th><th>URI</th><th>Tipo</th></tr></thead><tbody>' + tbody + '</tbody></table></div>';

		$('#streamList').html(table);
	}

	// Change the UI's appearance based on the selected server command
	function processSelectedCmd(cmd, stream) {
		var msg = ''; // message to display
		var enable = false; // disabled button

		switch (cmd) {
			case 'none':
				break; // do nothing
			case addStream:
				// Display the Add stream options
				$('#cmdAdd').show(duration);
				enable = true;

				break;
			case createHLS:
				// Display HLS options

				if ('' == stream) {
					// If no stream is selected, show that info and disable the button
					msg = 'Selecciona una stream de la lista y completa la configuraci&oacute;n para crear un stream HLS.';
				} else {
					msg = '&iquest;Crear un HLS desde el stream"' + stream + '"?';
					enable = true;
				}

				$('#cmdHLS').show(duration);
				break;
			case listStream:
				// No paramater command, process
				processListStream(false);
				return;
			case removeStream:
				// Display the Remove Stream options

				if ('' == stream) {
					// If no stream is selected, show that info and disable the button
					msg = 'Selecciona un stream de la lista para eliminar.';
				} else {
					msg = '&iquest;Eliminar el stream "' + stream + '"?';
					enable = true;
				}

				$('#cmdRemove').show(duration);
				break;
			case sendMpegTs:

				if ('' == stream) {
					// If no stream is selected, show that info and disable the button
					msg = 'Seleccionar un stream de la lista para enviar paquetes MPEG-TS.';
				} else {
					msg = '&iquest;Crear MPEG-TS para "' + stream + '"?';
					enable = true;
				}

				$('#cmdMpegSend').show(duration);

				break;
			default:
				break; // do nothing
		}

		setCmdMsgs(cmd, msg)
		setCmdButton(cmd, enable);
	}

	// Handler for listStream command
	function processListStream(ignoreError) {
		// Check for the validity of IP address
		if (checkIp()) {
			// Process the AJAX request and response
			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + getIp() + '&cmd='+ listStream,
				dataType:'json',
				async:true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.success){
						var tbody = '';

						// Process the response
						$.each(json.data, function(index, item) {
							if ((item.uri).indexOf('http://') == -1) {
								tbody += '<tr><td>' + item.id + '</td><td>' + item.name + '</td><td>' + item.uri + '</td><td>' + item.type + '</td></tr>'
							} else {
								// String 'http://' found, add a link.
								tbody += '<tr><td>' + item.id + '</td><td>' + item.name + '</td><td><a href="' + item.uri + '" target="_blank">' + item.uri + '</a></td><td>' + item.type + '</td></tr>'
							}
						});

						// In case we don't have any table content
						if ('' == tbody) {
							tbody = '<tr><td>-</td><td>-</td><td>No stream available...</td><td>-</td></tr>';

							// Hide the stream details and video
							$('#streamDetail').hide();
							$('#videoContainer').hide();
						}

						// Populate contents of table
						updateList(tbody);

						if (!ignoreError) {
							// Display the success message
							showStatus(false, '&iexcl;La lista de stream a sido actualizada!');
						}
					} else {
						if (!ignoreError) {
							// Otherwise show a failed message
							showStatus(true, '&iexcl;Error actulizando la lista! ' + ((null == json.description)? '' : json.description));
						}
					}

					if (ignoreError) {
						// Since we updated the stream list table, we still need this
						doKickStart();
					}
				}
			});
		}
	}

	// Play the selected stream
	function playVideo(stream, emsIP) {
		$f("videoContainer", "swf/flowplayer-3.2.11.swf", {
			plugins: {
				controls: null,
				rtmp: {
					url: 'flowplayer.rtmp-3.2.10.swf',
					netConnectionUrl: 'rtmp://' + emsIP + '/live'
				}
			},
			play: null,
			clip: {
				url: stream,
				live: true,
				provider: 'rtmp'
			}
		});
	}

	// Store the last used command
	$('#commandList').focus(function(){
		oldCmd = getCurrentCmd();
	});
	// Process the selection of server commands
	$('#commandList').change(function(){
		// Hide the previous command options/details
		switch (oldCmd) {
			case 'addStream':
				$('#cmdAdd').hide();
				break;
			case 'removeStream':
				$('#cmdRemove').hide();
				break;
			case 'createHLS':
				$('#cmdHLS').hide();
				break;
			case 'sendMpegTs':
				$('#cmdMpegSend').hide();
				break;
			default:
				break;
		}

		// Update the container for old value
		$('#commandList').trigger('focus');

		// Process the command selected
		var cmd = getCurrentCmd();
		var sName = getCurrentStream();

		processSelectedCmd(cmd, sName);

		return false;
	});

	// Add a stream to the server
	$('#cmdAddButton').live('click', function(){
		var stream = [];
		var sName = $('#streamName').val();
		var sSrc = $('#streamSource').val();
		var sForceTcp = ($('#forceTcp').is(":checked")) ? '1' : '0';
		var ip = getIp();

		// Sanity checks
		if(('' != sName) && ('' != sSrc)){
			stream.push('name=' + sName);
			stream.push('source=' + sSrc);
			stream.push('forceTcp=' + sForceTcp);
		} else {
			showStatus(true, '&iexcl;Ingresar un nombre y fuente de un Stream v&aacute;lido!');
			return false;
		}

		if (checkIp()) {

			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + ip + '&cmd=addStream&' + stream.join("&"),
				dataType:'json',
				async: true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.success) {
						showStatus(false, sName + ' fue a&ntilde;adido satisfactoriamente.');

						// Now send another request to update the stream list
						processListStream(true);
					} else {
						showStatus(true, 'Error al a&ntilde;adir stream: "' + sName + '"! ' + ((null == json.description)? '' : json.description));
					}
				}
			});
		}

		return false;
	});

	// Remove a stream from the server
	$('#cmdRemButton').live('click', function(){
		var ip = getIp();
		var sId = $('#idSrc').val();
		var sName = getCurrentStream();

		// Sanity checks
		if('' == sName){
			showStatus(true, 'Selecciona un stream de la lista');
			return false;
		}

		if (checkIp()){
			// Process the AJAX request and response
			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + ip + '&cmd=removeStream&id=' + sId,
				dataType:'json',
				async:true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.success) {
						showStatus(false, sName + ' fue eliminado satisfactoriamente.');

						// Now send another request to update the stream list
						processListStream(true);
					} else {
						showStatus(true, 'Error al eliminar el stream: "' + sName + '"! ' + ((null == json.description)? '' : json.description));
					}
				}
			});
		}

		return false;
	});

	// Create an HLS stream from the list
	$('#cmdHlsButton').live('click', function(){
		var ip = getIp();
		var sName = getCurrentStream();
		var folder = $('#folderHls').val();
		var group = $('#gNameHls').val();
		var cLen = $('#chunkLenHls').val();

		// Sanity checks
		if('' == sName){
			showStatus(true, 'Selecciona un stream de la lista');
			return false;
		}

		if (checkIp()){
			// Process the AJAX request and response
			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + ip + '&cmd=createHLS&name=' + sName + '&group=' + group + '&folder=' + folder + '&chunkLength=' + cLen,
				dataType:'json',
				async:true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.success) {
						showStatus(false, 'El stream HLS "' + sName + '" fue creado satisfactoriamente.');

						// Now send another request to update the stream lists
						processListStream(true);
					} else {
						showStatus(true, 'Error al a&ntilde;adir el stream HLS para "' + sName +'"! ' + ((null == json.description)? '' : json.description));
					}
				}
			});
		}

		return false;
	});

	// Push an MPEG-TS stream from the list
	$('#cmdSendMpgButton').live('click', function(){
		var ip = getIp();
		var sName = getCurrentStream();
		var target = $('#targetMpg').val();
		var port = $('#targetPortMpg').val();

		if ('' == port) {
			port = '10000';
		}

		target += ':' + port;

		// Sanity checks
		if('' == sName){
			showStatus(true, 'Selecciona un stream de la lista');
			return false;
		}

		if (checkIp()){
			// Process the AJAX request and response
			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + ip + '&cmd=sendMpegTs&name=' + sName + '&target=' + target,
				dataType:'json',
				async:true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.success) {
						showStatus(false, 'Los paquetes MPEG-TS "' + sName +'" estan enviandose a ' + target + '. ' + ((null == json.description)? '' : json.description));

						// Now send another request to update the stream lists
						processListStream(true);
					} else {
						showStatus(true, 'Error al a&ntilde;adir paquetes MPEG-TS para "' + sName +'"! ' + ((null == json.description)? '' : json.description));
					}
				}
			});
		}

		return false;
	});

	// Stop all MPEG-TS streams
	$('#cmdStopMpgButton').live('click', function(){
		var ip = getIp();

		// Sanity check
		if (checkIp()){
			// Process the AJAX request and response
			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + ip + '&cmd=stopMpegTs&stop=mpegtsudp',
				dataType:'json',
				async:true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.success) {
						showStatus(false, 'Detener MPEG-TS. ' + ((null == json.description)? '' : json.description));

						// Now send another request to update the stream lists
						processListStream(true);
					} else {
						showStatus(true, 'Error al detener MPEG-TS! ' + ((null == json.description)? '' : json.description));
					}
				}
			});
		}

		return false;
	});

	// Check the connection with the server
	$('#checkServer').live('click', function(){
		var ip = getIp();

		// Validate the IP address first
		if (checkIp()){
			// Process the AJAX request and response
			$.ajax({
				type:'POST',
				url:'php/evoapi-uiproxy.php',
				data:'ip=' + ip,
				dataType:'json',
				async:true,
				error: function(json, status){
					showAjaxErr(status);
				},
				success:function(json){
					if(json.connected) {
						// Show the command list
						connStatus(false);

						// Retrieve the list of streams
						processListStream(true);

						// Display the success message
						showStatus(false, 'Se conect&oacute; al servidor.');
					} else {
						// Hide the command list
						connStatus(true);

						// Otherwise show an error
						showStatus(true, 'No se puedo contectar a ' + ip + '!' + ((null == json.description)? '' : json.description));
					}
				}
			});
		}

		return false;
	});

	// Process the selected rows
	$('#streamListTable tbody tr').live('click', function(e){
		var values = $(this).children('td').map(function() {
			return this.innerHTML;
		}).toArray();

		var ip = getIp();

		// For now, only process pull streams, ignore the rest
		if ('pull' == values[3]) {
			$f(0).stop(); // stop???

			// Only update the details if this is a pull stream
			$('#nameSrc').val(values[1]);
			$('#srcSrc').val(values[2]);
			$('#rtmpSrc').val('rtmp://' + ip + '/live/' + values[1]);
			$('#rtspSrc').val('rtsp://' + ip + ':5544/' + values[1]);

			// Include the hidden input
			$('#idSrc').val(values[0]);

			// Display the details
			if(!$('#streamDetail').is(':visible')) {
				$('#streamDetail').show(duration);
			}

			// Display the video screen
			if(!$('#videoContainer').is(':visible')) {
				$('#videoContainer').show(duration);
			}


			// Determine the active server command
			var cmd = getCurrentCmd();
			switch (cmd) {
				case removeStream:
					setCmdMsgs(cmd, '&iquest;Eliminar el stream "' + values[1] + '"?');
					setCmdButton(cmd, true);
					break;
				case createHLS:
					setCmdMsgs(cmd, '&iquest;Crear stream HLS para "' + values[1] + '"?');
					setCmdButton(cmd, true);
					break;
				case sendMpegTs:
					setCmdMsgs(cmd, '&iquest;Crear MPEG-TS para "' + values[1] + '"?');
					setCmdButton(cmd, true);
					break;
				default:
					break;
			}
		}
	});

	// Play the selected video
	$('#playVid').live('click', function(e){
		var ip = getIp();

		// Sanity check
		if (checkIp()) {
			var name = getCurrentStream();

			if (name.length > 0) {
				playVideo(name, ip);
			} else {
				alert('Destino de video inv&aacute;lido. Actualizar p&aacute;gina.');
			}
		}
	});

	// Handler for enter key
	$('#ipAddress').live('keypress', function(e) {
		if (e.which == 13) {
			// Connect!
			$('#checkServer').trigger('click');
		}
	});

	// Download the streams XML file
	$('#xmlFile').live('click', function(e) {
		window.location.href = 'php/stream.php';
	});
});

// Disables all buttons to avoid user sending another request while a previous request is on-going
function serverBusy(isTrue) {
	var buttons = ['#commandList', '#cmdAddButton', '#cmdRemButton', '#cmdHlsButton', '#cmdSendMpgButton', '#cmdStopMpgButton'];

	if (isTrue) {
		// Loop through the buttons and disable it
		$.each(buttons, function(index, button) {
			$(button).attr('disabled', true);
		});

		// Change the cursor to "busy""
		$('body').css('cursor', 'wait');
	} else {
		// Enable it back
		$.each(buttons, function(index, button) {
			$(button).attr('disabled', false);
		});

		// Revert the cursor
		$('body').css('cursor', 'auto');
	}
}

jQuery(document).ajaxStart(function(){
	// Disable the major buttons/elements
	serverBusy(true);
});

jQuery(document).ajaxStop(function(){
	// Enable back the buttons
	serverBusy(false);
});
