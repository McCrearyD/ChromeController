const debug = false;

var haveEvents = 'GamepadEvent' in window;
var controllers = {};

// define event names as they correspond to button names
const controls = {};
controls.axisEventNames = ["leftanaloghorizontal", "leftanalogvertical", "rightanaloghorizontal", "rightanalogvertical"];
controls.buttonEventNames = ["abutton", "bbutton", "xbutton", "ybutton", "leftbumper", "rightbumper", "lefttrigger", "righttrigger", "selectbutton", "startbutton", "leftanalogbutton", "rightanalogbutton", "dpadup", "dpaddown", "dpadleft", "dpadright", "homebutton"];

/* Debug Messages */
if (debug) {
	controls.buttonEventNames.forEach(function (name) {
		window.addEventListener(name + "hold", () => console.log(name + " hold"), true);
		window.addEventListener(name + "released", () => console.log(name + " released"), true);
		window.addEventListener(name + "pressed", () => console.log(name + " pressed"), true);
		// window.addEventListener( name + "poll", () => console.log( name + " poll" ), true );
	});

	controls.axisEventNames.forEach(function (name) {
		window.addEventListener(name, () => console.log(name + " changed"), true);
		window.addEventListener(name + "max", () => console.log(name + " max"), true);
		// window.addEventListener( name + "poll", () => console.log( name + " poll" ), true );
	});
}
/* ************** */

var rAF = window.mozRequestAnimationFrame ||
	window.requestAnimationFrame;

function connecthandler(e) {
	controllers[e.gamepad.index] = e.gamepad;
	rAF(pollEvents);
	console.log(e.gamepad.id + " connected.");
}

function disconnecthandler(e) {
	removegamepad(e.gamepad);
	console.log(e.gamepad.id + " disconnected.");
}

function removegamepad(gamepad) {
	delete controllers[gamepad.index];
}

function pollEvents() {
	if (document.hasFocus()) {

		scangamepads();

		for (let k in controllers) {
			let controller = controllers[k];

			// Check for button usage
			for (let i = 0; i < controller.buttons.length; i++) {
				let eventName = controls.buttonEventNames[i];

				let event;
				let cur = 0;

				if (controller.buttons[i].pressed) {
					cur = eventName === "dpadup" ? -1 : 1;
				}

				if (controller.buttons[i].pressed && controller.previous.pressedButtons[i]) {
					// dispatch hold
					// TODO add hold duration
					event = new CustomEvent(eventName + "hold", {
						detail: {
							controller: controller,
							current: cur
						}
					});
				} else if (!controller.buttons[i].pressed && controller.previous.pressedButtons[i]) {
					// dispatch released
					event = new CustomEvent(eventName + "released", {
						detail: {
							current: cur,
							controller: controller
						}
					});
				} else if (controller.buttons[i].pressed && !controller.previous.pressedButtons[i]) {
					// dispatch pressed
					event = new CustomEvent(eventName + "pressed", {
						detail: {
							current: cur,
							controller: controller
						}
					});
				} else {
					continue;
				}

				poll = new CustomEvent(eventName + "poll", {
					detail: {
						controller: controller
					}
				});

				window.dispatchEvent(poll);
				window.dispatchEvent(event);
			}
			// ********************* //

			// Check for analog stick movement
			for (let i = 0; i < controller.axes.length; i++) {
				if (Math.abs(controller.previous.axes[i] - controller.axes[i]) >= 0.01) {
					let maxE;
					if (controller.axes[i] >= 1 || controller.axes[i] <= -1) {
						maxE = new CustomEvent(controls.axisEventNames[i] + "max", {
							detail: {
								axis: i,
								previous: controller.previous.axes[i],
								current: controller.axes[i],
								controller: controller
							}
						});
					}

					let event = new CustomEvent(controls.axisEventNames[i], {
						detail: {
							axis: i,
							previous: controller.previous.axes[i],
							current: controller.axes[i],
							controller: controller
						}
					});

					if (maxE) {
						window.dispatchEvent(maxE);
					}
					window.dispatchEvent(event);
				}

				let poll = new CustomEvent(controls.axisEventNames[i] + "poll", {
					detail: {
						axis: i,
						previous: controller.previous.axes[i],
						current: controller.axes[i],
						controller: controller
					}
				});

				window.dispatchEvent(poll);
			}
			// ********************* //

			// ************************* MUST BE LAST ************************* //
			for (let i = 0; i < controller.axes.length; i++) {
				controller.previous.axes[i] = controller.axes[i];
			}
			for (let i = 0; i < controller.buttons.length; i++) {
				controller.previous.pressedButtons[i] = controller.buttons[i].pressed;
			}
			controller.previous.leftTrigger = controller.buttons[6].value;
			controller.previous.rightTrigger = controller.buttons[7].value;
			// **************************************************************** //
		}
	}

	rAF(pollEvents);
}

function scangamepads() {
	var gamepads = navigator.getGamepads();
	for (var i = 0; i < gamepads.length; i++) {
		if (gamepads[i]) {
			if (controllers[gamepads[i].index] && controllers[gamepads[i].index].previous) {
				// Existing controller with existing state, so we need to save the previous state.
				let previous = controllers[gamepads[i].index].previous;
				controllers[gamepads[i].index] = gamepads[i];
				controllers[gamepads[i].index].previous = previous;
			} else {
				// New controller, so we need to create the empty previous state.
				controllers[gamepads[i].index] = gamepads[i];

				let controller = controllers[gamepads[i].index];
				controller.previous = {};
				controller.previous.axes = [];
				controller.previous.pressedButtons = [];
				controller.previous.leftTrigger = 0;
				controller.previous.rightTrigger = 0;
			}
		}
	}
}

if (haveEvents) {
	window.addEventListener("gamepadconnected", connecthandler, true);
	window.addEventListener("gamepaddisconnected", disconnecthandler, true);
} else {
	setInterval(scangamepads, 500);
}