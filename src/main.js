import App from './App.svelte';
import { hsv2rgb } from './utils';

const params = new URLSearchParams(window.location.search);

const input = params.get('input')
let props = {};

if (input) {
	let [skinId, hairId, shirtId, pantId, accessoryId, ...therest] = input.split(',');
	let eyeColor = hsv2rgb(therest[0], therest[1], therest[2]);
	let hairColor = hsv2rgb(therest[3], therest[4], therest[5]);
	let pantColor = hsv2rgb(therest[6], therest[7], therest[8]);
	let petId = parseInt(therest[9] || 2) || 2;

	props = {
		skinId,
		hairId,
		shirtId,
		pantId,
		accessoryId,
		eyeColor,
		hairColor,
		pantColor,
		petId
	};
}

const app = new App({
	target: document.body,
	props
});

export default app;
