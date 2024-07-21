import { Injectable } from '@angular/core';

@Injectable()
export class EmojiDataService {
	constructor() {
		console.log('gets heres');
	}

	//use indexDb to store emojis by having a store for each category and store all emoji with values inside.
	//Save state of last skincolor of emoji, with the value of emoji. (as well in grouped as in flattened)
	//Garbage collection after save dbIndex
	//store recents (first empty array?)
}
