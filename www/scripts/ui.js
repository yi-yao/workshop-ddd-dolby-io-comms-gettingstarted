const initUI = async () => {
	// Update the login message with the name of the user
	document.getElementById("name-input").value = randomName;
	document.getElementById("alias-input").value = "TeamC_Demo";

	// Update the UI
	const setVideoDeviceBtn = document.getElementById("set-video-device-btn");
	const setInputAudioDeviceBtn = document.getElementById("set-input-audio-device-btn");
	const setOutputAudioDeviceBtn = document.getElementById("set-output-audio-device-btn");

	// Settings UI
	const videoDevices = document.getElementById("video-devices");
	const inputAudioDevices = document.getElementById("input-audio-devices");
	const outputAudioDevices = document.getElementById("output-audio-devices");

	// Start with audio off and Dolby Voice On
	let audioOn = true;
	let useDolbyVoice = true;

	document.getElementById("dolby-voice-btn").onclick = async () => {
		if (document.getElementById("dolby-voice-btn").checked == true) {
			useDolbyVoice = true;
		} else {
			useDolbyVoice = false;
		}
		document.getElementById("label-dolby-voice").innerHTML = `Dolby Voice ${useDolbyVoice ? "On" : "Off"}`;
	};

	// Set The device Selection
	setVideoDeviceBtn.onclick = async () => {
		let selectedVideoDevice = videoDevices.options[videoDevices.selectedIndex];
		// snackbar alert for device change
		var snackbar = document.getElementById("snackbar");
		snackbar.className = "show";
		snackbar.innerHTML = `You're video device has been set to: ${selectedVideoDevice.text}`;
		setTimeout(function () {
			snackbar.className = snackbar.className.replace("show", "");
		}, 6000);
		await VoxeetSDK.mediaDevice.selectVideoInput(selectedVideoDevice.value);
	};

	setInputAudioDeviceBtn.onclick = async () => {
		let selectedInputAudioDevice = inputAudioDevices.options[inputAudioDevices.selectedIndex];
		var snackbar = document.getElementById("snackbar");
		snackbar.className = "show";
		snackbar.innerHTML = `You're input audio device (mic) has been set to: ${selectedInputAudioDevice.text}`;
		setTimeout(function () {
			snackbar.className = snackbar.className.replace("show", "");
		}, 6000);
		await VoxeetSDK.mediaDevice.selectAudioInput(selectedInputAudioDevice.value);
	};

	setOutputAudioDeviceBtn.onclick = async () => {
		let selectedOutputAudioDevice = outputAudioDevices.options[outputAudioDevices.selectedIndex];
		var snackbar = document.getElementById("snackbar");
		snackbar.className = "show";
		snackbar.innerHTML = `You're output audio device (speaker) has been set to: ${selectedOutputAudioDevice.text}`;
		setTimeout(function () {
			snackbar.className = snackbar.className.replace("show", "");
		}, 6000);
		await VoxeetSDK.mediaDevice.selectAudioOutput(selectedOutputAudioDevice.value);
	};

	document.getElementById("join-btn").onclick = async () => {
		// open a session with participant object
		await VoxeetSDK.session
			.open({ name: document.getElementById("name-input").value })
			.catch((err) => console.error(err));

		// Default conference parameters
		// See: https://docs.dolby.io/communications-apis/docs/js-client-sdk-model-conferenceparameters
		// What if we changed these?
		let conferenceParams = {
			liveRecording: true,
			rtcpMode: "average", // worst, average, max
			ttl: 0,
			videoCodec: "H264", // H264, VP8
			dolbyVoice: useDolbyVoice,
		};

		// See: https://docs.dolby.io/interactivity/docs/js-client-sdk-model-conferenceoptions
		let conferenceOptions = {
			alias: document.getElementById("alias-input").value,
			params: conferenceParams,
		};

		let recordStatus = document.getElementById("record-status");

		// 1. Create a conference room with an alias
		VoxeetSDK.conference
			.create(conferenceOptions)
			.then((conference) => {
				// See: https://docs.dolby.io/interactivity/docs/js-client-sdk-model-joinoptions
				const joinOptions = {
					constraints: {
						audio: audioOn,
						video: true,
					},
					//preferRecvMono: true,
					preferSendMono: true,
					//spatialAudio: useDolbyVoice, // Turn on Spatial Audio
				};

				// 2. Join the conference
				// What if we instead enabled all buttons?
				VoxeetSDK.conference
					.join(conference, joinOptions)
					.then((conf) => {
						//update ui
						document.getElementById("name-input").disabled = true;
						document.getElementById("join-btn").classList.add("d-none");
						document.getElementById("leave-btn").classList.remove("d-none");
						document.getElementById("nav-settings").classList.remove("d-none");

						//conditional
						// Show and hide
						if (audioOn) {
							// hide the start btn
							document.getElementById("start-audio-btn").classList.add("d-none");
							document.getElementById("stop-audio-btn").classList.remove("d-none");
						} else {
							// show start btn
							document.getElementById("start-audio-btn").classList.remove("d-none");
							document.getElementById("stop-audio-btn").classList.add("d-none");
						}

						//reset other ui elements
						document.getElementById("start-video-btn").classList.add("d-none");
						document.getElementById("stop-video-btn").classList.remove("d-none");
						document.getElementById("start-screenshare-btn").classList.remove("d-none");
						document.getElementById("stop-screenshare-btn").classList.add("d-none");
						document.getElementById("start-recording-btn").classList.add("d-none");
						document.getElementById("stop-recording-btn").classList.add("d-none");
						document.getElementById("participants-settings").classList.remove("d-none");

						document.getElementById("label-dolby-voice").innerHTML = `Dolby Voice ${
							conf.params.dolbyVoice ? "On" : "Off"
						}`;
						useDolbyVoice = conf.params.dolbyVoice;
						document.getElementById("dolby-voice-btn").checked = useDolbyVoice;
						document.getElementById("alias-input").disabled = true; //Could try changing to false? What would happen?

						// Populate All Device options once
						if (videoDevices.options.length == 0) {
							enumerateMediaDevices();
						}
						VoxeetSDK.recording
							.start()
							.then(() => {
								recordStatus.innerText = "Recording...Always on by default";
								document.getElementById("record-status").classList.remove("d-none");
							})
			.catch((err) => console.error(err));
					})
					.catch((err) => console.error(err));
			})
			.catch((err) => console.error(err));

	};

	document.getElementById("leave-btn").onclick = async () => {
		// Leave the conference
		let recordStatus = document.getElementById("record-status");

		// Stop recording the conference
		VoxeetSDK.recording
			.stop()
			.then(() => {
				recordStatus.innerText = "";
				//update ui
				document.getElementById("start-recording-btn").classList.remove("d-none");
				document.getElementById("stop-recording-btn").classList.add("d-none");
				document.getElementById("record-status").classList.add("d-none");
			})
			.catch((err) => console.error(err));

		VoxeetSDK.conference
			.leave()
			.then(() => {
				// See Docs:  https://docs.dolby.io/communications-apis/docs/initializing-javascript#open-a-session
				// close the session
				VoxeetSDK.session
					.close()
					.then(() => {
						//update ui
						document.getElementById("join-btn").classList.remove("d-none");
						document.getElementById("leave-btn").classList.add("d-none");
						document.getElementById("label-dolby-voice").innerHTML = `Dolby Voice ${useDolbyVoice ? "On" : "Off"}`;
						document.getElementById("name-input").disabled = false;
						document.getElementById("alias-input").disabled = false;
						//reset other ui elements
						document.getElementById("start-video-btn").classList.add("d-none");
						document.getElementById("stop-video-btn").classList.add("d-none");
						document.getElementById("start-audio-btn").classList.add("d-none");
						document.getElementById("stop-audio-btn").classList.add("d-none");
						document.getElementById("start-screenshare-btn").classList.add("d-none");
						document.getElementById("stop-screenshare-btn").classList.add("d-none");
						document.getElementById("start-recording-btn").classList.add("d-none");
						document.getElementById("stop-recording-btn").classList.add("d-none");
						document.getElementById("participants-settings").classList.add("d-none");
						document.getElementById("uploadInput").disabled = false;
					})
					.catch((err) => console.error(err));
			})
			.catch((err) => console.error(err));
	};

	// Determine and update UI based on who is speaking
	const beginIsSpeaking = () => {
		// check if the current session participant is speaking every 5 milliseconds
		setInterval(() => {
			let participants = VoxeetSDK.conference.participants;

			for (let participant of participants) {
				VoxeetSDK.conference.isSpeaking(VoxeetSDK.conference.participants.get(participant[0]), (isSpeaking) => {
					console.log("The participant", participant[0], "speaking status:", isSpeaking);
					// get card body
					if (document.getElementById(`video-${participant[0]}`) == undefined) {
						return;
					}

					let card = document.getElementById(`video-${participant[0]}`).parentElement;
					if (isSpeaking) {
						// participant is speaking, update UI accordingly by adding class
						card.classList.remove("video-card-body");
						card.classList.add("video-card-body-isspeaking");
					} else if (!isSpeaking) {
						card.classList.remove("video-card-body-isspeaking");
						card.classList.add("video-card-body");
					}
				});
			}
		}, 500);
	};

	document.getElementById("start-video-btn").onclick = async () => {
		// Start sharing the video with the other participants
		VoxeetSDK.conference
			.startVideo(VoxeetSDK.session.participant)
			.then(() => {
				//update ui
				document.getElementById("start-video-btn").classList.add("d-none");
				document.getElementById("stop-video-btn").classList.remove("d-none");
			})
			.catch((err) => console.error(err));
	};

	document.getElementById("stop-video-btn").onclick = async () => {
		// Stop sharing the video with the other participants
		VoxeetSDK.conference
			.stopVideo(VoxeetSDK.session.participant)
			.then(() => {
				//update ui
				document.getElementById("start-video-btn").classList.remove("d-none");
				document.getElementById("stop-video-btn").classList.add("d-none");
			})
			.catch((err) => console.error(err));
	};

	document.getElementById("start-audio-btn").onclick = async () => {
		// Start sharing the Audio with the other participants
		VoxeetSDK.conference
			.startAudio(VoxeetSDK.session.participant)
			.then(() => {
				//update ui
				document.getElementById("start-audio-btn").classList.add("d-none");
				document.getElementById("stop-audio-btn").classList.remove("d-none");

				beginIsSpeaking();
			})
			.catch((err) => console.error(err));
	};

	document.getElementById("stop-audio-btn").onclick = async () => {
		// Stop sharing the Audio with the other participants
		VoxeetSDK.conference
			.stopAudio(VoxeetSDK.session.participant)
			.then(() => {
				//update ui
				document.getElementById("start-audio-btn").classList.remove("d-none");
				document.getElementById("stop-audio-btn").classList.add("d-none");
			})
			.catch((err) => console.error(err));
	};

	document.getElementById("start-screenshare-btn").onclick = async () => {
		// Start the Screen Sharing with the other participants
		VoxeetSDK.conference
			.startScreenShare()
			.then(() => {
				//update ui
				document.getElementById("start-screenshare-btn").classList.add("d-none");
				document.getElementById("stop-screenshare-btn").classList.remove("d-none");
			})
			.catch((err) => console.error(err));
	};

	document.getElementById("stop-screenshare-btn").onclick = async () => {
		// Stop the Screen Sharing
		VoxeetSDK.conference
			.stopScreenShare()
			.then(() => {
				//update ui
				document.getElementById("start-screenshare-btn").classList.remove("d-none");
				document.getElementById("stop-screenshare-btn").classList.add("d-none");
			})
			.catch((err) => console.error(err));
	};

	// document.getElementById("start-recording-btn").onclick = async () => {
	// 	let recordStatus = document.getElementById("record-status");

	// 	// Start recording the conference
	// 	VoxeetSDK.recording
	// 		.start()
	// 		.then(() => {
	// 			recordStatus.innerText = "Recording...Always on by default";
	// 			//update ui
	// 			document.getElementById("start-recording-btn").classList.add("d-none");
	// 			document.getElementById("stop-recording-btn").classList.remove("d-none");
	// 		})
	// 		.catch((err) => console.error(err));
	// };

	// document.getElementById("stop-recording-btn").onclick = async () => {
	// 	let recordStatus = document.getElementById("record-status");

	// 	// Stop recording the conference
	// 	VoxeetSDK.recording
	// 		.stop()
	// 		.then(() => {
	// 			recordStatus.innerText = "";
	// 			//update ui
	// 			document.getElementById("start-recording-btn").classList.remove("d-none");
	// 			document.getElementById("stop-recording-btn").classList.add("d-none");
	// 		})
	// 		.catch((err) => console.error(err));
	// };

	// enumerate the devices using Dolby

	const enumerateMediaDevices = async () => {
		// Load the Output Audio devices
		VoxeetSDK.mediaDevice
			.enumerateAudioDevices("output")
			.then((devices) => {
				devices.forEach((device) => {
					outputAudioDevices.append(new Option(device.label, device.deviceId));
				});

				setOutputAudioDeviceBtn.disabled = false;
			})
			.catch((err) => console.error(err));

		// Load the Input Audio devices
		VoxeetSDK.mediaDevice
			.enumerateAudioDevices("input")
			.then((devices) => {
				devices.forEach((device) => {
					inputAudioDevices.append(new Option(device.label, device.deviceId));
				});
				setInputAudioDeviceBtn.disabled = false;
			})
			.catch((err) => console.error(err));

		// Load the Video devices
		VoxeetSDK.mediaDevice
			.enumerateVideoDevices("input")
			.then((devices) => {
				devices.forEach((device) => {
					videoDevices.append(new Option(device.label, device.deviceId));
				});

				setVideoDeviceBtn.disabled = false;
			})
			.catch((err) => console.error(err));

		// Hide Output devices for safari
		if (navigator.vendor == "Apple Computer, Inc.") {
			document.getElementById("refresh-devices-btn").previousElementSibling.classList.add("d-none");
		}
	};

	document.getElementById("refresh-devices-btn").onclick = async () => {
		let devices = await enumerateMediaDeviceSources();
		// Clear the options
		videoDevices.innerText = null;
		inputAudioDevices.innerText = null;
		outputAudioDevices.innerText = null;

		let cameras = devices.cameras;
		let mics = devices.mics;
		let outputs = devices.outputs;

		cameras.forEach((device) => {
			videoDevices.append(new Option(device.label, device.deviceId));
		});

		mics.forEach((device) => {
			inputAudioDevices.append(new Option(device.label, device.deviceId));
		});

		outputs.forEach((device) => {
			outputAudioDevices.append(new Option(device.label, device.deviceId));
		});
		setVideoDeviceBtn.disabled = false;
		setInputAudioDeviceBtn.disabled = false;
		setOutputAudioDeviceBtn.disabled = false;

		if (navigator.vendor == "Apple Computer, Inc.") {
			document.getElementById("refresh-devices-btn").previousElementSibling.classList.add("d-none");
		}
	};

	async function enumerateMediaDeviceSources() {
		if (navigator && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function") {
			try {
				/* open a generic stream to get permission to see devices;
				 * Mobile Safari insists */
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: true,
				});
				let devices = await navigator.mediaDevices.enumerateDevices();

				const cameras = devices.filter((device) => {
					return device.kind === "videoinput";
				});
				if (cameras.length >= 1) console.log("cameras avail");

				const mics = devices.filter((device) => {
					return device.kind === "audioinput";
				});
				if (mics.length >= 1) console.log("mics avail");

				const outputs = devices.filter((device) => {
					return device.kind === "audiooutput";
				});
				if (outputs.length >= 1) console.log("outputs avail");

				/* release stream */
				const tracks = stream.getTracks();
				if (tracks) {
					for (let t = 0; t < tracks.length; t++) tracks[t].stop();
				}
				return { cameras, mics, outputs };
			} catch (error) {
				/* user refused permission, or media busy, or some other problem */
				console.error(error.name, error.message);
				return { cameras: [], mics: [], outputs: [] };
			}
		} else throw "media device stuff not available in this browser";
	}

	// end UIInit
};

// Add a video stream to the web page
const addVideoNode = (participant, stream) => {
	let videoNode = document.getElementById("video-" + participant.id);
	// let cardNode = videoNode.parentElement.parentElement;
	// console.log(cardNode);

	if (!videoNode) {
		const videoContainer = document.getElementById("video-container");
		let cardNode = buildVideoNode(participant.info.name, participant.id);
		videoNode = document.createElement("video");
		videoNode.setAttribute("id", "video-" + participant.id);

		// add css class to mirror current user's video
		if (participant.id === VoxeetSDK.session.participant.id) {
			videoNode.classList.add("flipped-video");
		} else {
			videoNode.classList.remove("flipped-video");
		}

		videoNode.setAttribute("height", "100%");
		videoNode.setAttribute("width", "100%");
		videoNode.setAttribute("playsinline", true);
		videoNode.muted = true;
		videoNode.setAttribute("autoplay", "autoplay");

		// insert the video card
		videoContainer.insertAdjacentHTML("beforeend", cardNode);
		// update the video element in the video card with our videoNode
		document.getElementById("video-card-body-" + participant.id).firstElementChild.replaceWith(videoNode);

		// add event handlers for mute / unmute buttons
		// addMuteListeners();
	}
	navigator.attachMediaStream(videoNode, stream);
};

// Remove the video stream from the web page
const removeVideoNode = (participant) => {
	let videoNode = document.getElementById("video-" + participant.id);
	if (videoNode) {
		// traverse up parentNode to find cardNode element
		let cardNode = videoNode.parentElement.parentElement.parentElement;
		videoNode.srcObject = null; // Prevent memory leak in Chrome
		cardNode.parentNode.removeChild(cardNode);
		// add update event handlers for mute / unmute buttons
		// updateMuteListeners()
	}
};

// Add a new participant to the list
const addParticipantNode = (participant) => {
	// If the participant is the current session user, don't add them to the list
	if (participant.id === VoxeetSDK.session.participant.id) return;

	let participantNode = document.createElement("li");
	participantNode.setAttribute("id", "participant-" + participant.id);
	participantNode.setAttribute("class", "list-group-item");
	participantNode.innerText = `${participant.info.name}`;

	const participantsList = document.getElementById("participants-list");
	participantsList.appendChild(participantNode);
	var snackbar = document.getElementById("snackbar");
	snackbar.className = "show";
	snackbar.innerHTML = `${participant.info.name} has joined`;
	setTimeout(function () {
		snackbar.className = snackbar.className.replace("show", "");
	}, 6000);
};

// Remove a participant from the list
const removeParticipantNode = (participant) => {
	let participantNode = document.getElementById("participant-" + participant.id);

	if (participantNode) {
		participantNode.parentNode.removeChild(participantNode);
	}
	var snackbar = document.getElementById("snackbar");
	snackbar.className = "show";
	snackbar.innerHTML = `${participant.info.name} has left`;
	setTimeout(function () {
		snackbar.className = snackbar.className.replace("show", "");
	}, 6000);
};

// Add a screen share stream to the web page
const addScreenShareNode = (stream) => {
	let screenShareNode = document.getElementById("screenshare");

	if (screenShareNode) {
		var snackbar = document.getElementById("snackbar");
		snackbar.className = "show";
		snackbar.innerHTML = "There is already a participant sharing a screen!";
		setTimeout(function () {
			snackbar.className = snackbar.className.replace("show", "");
		}, 6000);
	}

	screenShareNode = document.createElement("video");
	screenShareNode.setAttribute("id", "screenshare");
	screenShareNode.classList.add("w-75");
	screenShareNode.autoplay = "autoplay";
	screenShareNode.setAttribute("controls", true);
	navigator.attachMediaStream(screenShareNode, stream);
	const screenShareContainer = document.getElementById("screenshare-container");
	screenShareContainer.appendChild(screenShareNode);
};

// Remove the screen share stream from the web page
const removeScreenShareNode = () => {
	let screenShareNode = document.getElementById("screenshare");
	if (screenShareNode) {
		screenShareNode.srcObject = null; // Prevent memory leak in Chrome
		screenShareNode.parentNode.removeChild(screenShareNode);
	}
	document.getElementById("start-screenshare-btn").disabled = false;
	document.getElementById("stop-screenshare-btn").disabled = true;
};

// Utilities

// Build  video card node via a template
const buildVideoNode = (name, id) => {
	let cardID = "video-card-" + id;
	let cardBodyID = "video-card-body-" + id;
	let videoID = "video-" + id;

	let node = `       
  <div id="${cardID}"  class="col.12 col-sm-4">
  <div class="card d-xl-flex flex-shrink-1 justify-content-xl-center align-items-xl-center" 
  style="margin: 6px;margin-top: 5px;margin-right: 5px;margin-bottom: 5px;margin-left: 5px;">
      <div id="${cardBodyID}" class="card-body text-sm-center text-capitalize text-center text-white-50 video-card-body">
   <video id="${videoID}" class="video-player" width="100%" height="100%" autoplay="" playsinline="true" muted style="width: 100%;height: 100%;">
      </video>
          <h4 class="text-center card-title">${name}</h4>
          <div class="mic" style="width=16px; height=16px;"></div>
          <div class="btn-toolbar text-sm-center d-xl-flex d-xxl-flex justify-content-xl-end align-items-xl-center justify-content-xxl-end align-items-xxl-center">
          <div class="form-check form-switch d-none">
          <input class="form-check-input mute-switch" data-participant="${id}" type="checkbox" role="switch" checked>
         <label class="form-check-label text-sm-center text-info data-participant="${id} mute-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
            <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"/>
            <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
            </svg>
         </label>
        </div>
          </div>
      </div>
  </div>
  </div>`;
	return node;
};

// dynamically add event listeners as video cards are added to dom.
const addMuteListeners = () => {
	document.querySelectorAll([".mute-switch"]).forEach((ele) => {
		ele.onclick = () => {
			let participant = VoxeetSDK.conference.participants.get(ele.dataset.participant);

			if (ele.checked == true) {
				VoxeetSDK.conference.mute(participant, true);
				ele.nextElementSibling.innerHTML = ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
        <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"/>
        <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
        </svg>`;
				console.log(`${participant.info.name} is muted `, VoxeetSDK.conference.isMuted());
			} else {
				VoxeetSDK.conference.mute(participant, false);
				ele.nextElementSibling.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16">
        <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/>
        <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
        </svg>`;

				console.log(`${participant.info.name} is muted `, VoxeetSDK.conference.isMuted());
			}
		};
	});
};

const validFiles = ["wav", "mp3", "mp4", "m4a", "mov", "3gp", "m4b", "acc"]; //https://docs.dolby.io/media-apis/docs/supported-formats
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getResults() {
	//Gets and displays the results of the Analyze job
	const mAPIKey = process.env.API_KEY;
	let output_percent = document.getElementById("percentage_music");
	let output_num = document.getElementById("number_of_music_sections");

	const options = {
		method: "GET",
		headers: { Accept: "application/octet-stream", "x-api-key": mAPIKey },
	};

	let json_loc = await fetch("https://api.dolby.com/media/output?url=dlb://file_output.json", options)
		.then((response) => response.json())
		.catch((err) => console.error(err));

	console.log(json_loc.processed_region);
	document.getElementById("result_box").style.visibility = "visible";

	output_percent.textContent = "Percentage of track containing music: "
		.concat(JSON.stringify(json_loc.processed_region.audio.music.percentage))
		.concat("%");
	output_num.textContent = "Number of sections with music: ".concat(
		JSON.stringify(json_loc.processed_region.audio.music.num_sections)
	);

	//Update our output table with results
	for (const key in json_loc.processed_region.audio.music.sections) {
		let start = json_loc.processed_region.audio.music.sections[key]["start"];
		let end = start + json_loc.processed_region.audio.music.sections[key]["duration"];
		let loud = json_loc.processed_region.audio.music.sections[key]["loudness"];
		let genre = json_loc.processed_region.audio.music.sections[key]["genre"];

		var table = document.getElementById("myTable");
		var row = table.insertRow(1);
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		var cell4 = row.insertCell(3);
		var cell5 = row.insertCell(4);
		cell1.innerHTML = String(key);
		cell2.innerHTML = String(start.toFixed(2));
		cell3.innerHTML = String(end.toFixed(2));
		cell4.innerHTML = String(loud);
		cell5.innerHTML = String(genre);
	}
	document.getElementById("myBtn").innerText = "Complete";
	document.getElementById("download").disabled = false;
	document.getElementById("download").style.visibility = "visible";

	const a = document.getElementById("downloadLink");
	const file = new Blob([JSON.stringify(json_loc)], { type: "text/plain" });
	a.href = URL.createObjectURL(file);

	return json_loc;
}

async function checkJobStatus(jobID) {
	//Checks the status of the created job using the jobID
	const mAPIKey = process.env.API_KEY;
	const options = {
		method: "GET",
		headers: { Accept: "application/json", "x-api-key": mAPIKey },
	};

	let result = await fetch("https://api.dolby.com/media/analyze?job_id=".concat(jobID), options).then((response) =>
		response.json()
	);
	console.log(result);

	var elem = document.getElementById("myBar");
	elem.style.width = result.progress + "%";

	if (result.status == "Failed" || result.status == 401) {
		console.log("ERROR: Job Failed");
		const start_button = document.getElementById("myBtn");
		start_button.innerText = "FAILED!";
		throw new Error("Job Failed: Check file type and Media API Key");
	} else if (result.progress != "100") {
		await delay(3000);
		checkJobStatus(jobID, mAPIKey);
	} else {
		elem.textContent = "Complete";
		let results = getResults(mAPIKey);
		return results;
	}
}

async function startJob(fileLocation) {
	//Starts an Analyze Job
	const mAPIKey = process.env.API_KEY;
	const options = {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-api-key": mAPIKey,
		},
		body: JSON.stringify({
			content: { silence: { threshold: -60, duration: 2 } },
			input: fileLocation,
			output: "dlb://file_output.json",
		}),
	};

	let resp = await fetch("https://api.dolby.com/media/analyze", options)
		.then((response) => response.json())
		.catch((err) => console.error(err));
	console.log(resp);
	return resp.job_id;
}

async function uploadFile(fileType) {
	//Uploads the file to the Dolby.io server
	const mAPIKey = process.env.API_KEY;
	let audioFile = document.getElementById("uploadInput").files[0];
	let formData = new FormData();
	var xhr = new XMLHttpRequest();
	formData.append(fileType, audioFile);

	const options = {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-api-key": mAPIKey,
		},
		body: JSON.stringify({ url: "dlb://file_input.".concat(fileType) }),
	};
	document.getElementById("myBtn").innerText = "Uploading ...";

	let resp = await fetch("https://api.dolby.com/media/input", options)
		.then((response) => response.json())
		.catch((err) => console.error(err));
	console.log(resp.url);

	xhr.open("PUT", resp.url, true);
	xhr.setRequestHeader("Content-Type", fileType);
	xhr.onload = () => {
		if (xhr.status === 200) {
			console.log("File Upload Success");
		}
	};
	xhr.onerror = () => {
		console.log("error");
	};
	xhr.send(formData);
	let rs = xhr.readyState;
	while (rs != 4) {
		await delay(1000); //Delay to slow readyState checking
		rs = xhr.readyState;
	}

	return "dlb://file_input.".concat(fileType);
}

function updateSize() {
	//Function for stating the size of the selected file
	const start_button = document.getElementById("myBtn");

	let nBytes = 0,
		oFiles = this.files,
		nFiles = oFiles.length;
	for (let nFileId = 0; nFileId < nFiles; nFileId++) {
		nBytes += oFiles[nFileId].size;
	}
	let sOutput = (nBytes / 1000000).toFixed(2) + " Megabytes";
	document.getElementById("fileSize").innerHTML = sOutput;
	let fileType = this.value.split(".").at(-1);

	if (validFiles.includes(fileType)) {
		start_button.textContent = "Start Job";
		start_button.disabled = false;
	} else {
		start_button.textContent = "ERROR: PICK A VALID FILE TYPE!";
		start_button.disabled = true;
	}
}

function enableFile() {
	//Checks to see that the appropriate steps are being followed to start a job
	let selectedFile = document.getElementById("uploadInput");
	selectedFile.disabled = false;
}

async function startAudioAnalysis() {
	//Starts the audio analysis pipeline:
	//Upload -> Call job -> Check Job Status - > Get Results

	try {
		console.log("Job starting");
		let selectedFile = document.getElementById("uploadInput");
		let mAPIKey = document.getElementById("mAPIKey").value;
		let fileType = selectedFile.value.split(".")[1];

		document.getElementById("myBtn").disabled = true;
		selectedFile.disabled = true;

		let fileLocation = await Promise.resolve(uploadFile(fileType, mAPIKey).then((results) => results));
		document.getElementById("myBtn").innerText = "Running...";
		let jobID = await startJob(fileLocation, mAPIKey).then((results) => results);
		let results = await checkJobStatus(jobID, mAPIKey).then((results) => results);
	} catch {
		//Reset if something fails
		document.getElementById("uploadInput").value = null;
		document.getElementById("mAPIKey").value = null;
		document.getElementById("myBtn").disabled = false;
		document.getElementById("myBtn").textContent = "Start Job";
		document.getElementById("myBtn").disabled = true;
		document.getElementById("fileSize").innerHTML = "File Size: 0";
	}
}
