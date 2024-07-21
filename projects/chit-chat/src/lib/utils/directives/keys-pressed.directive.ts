import {
	Directive,
	EventEmitter,
	HostListener,
	Input,
	Output,
} from '@angular/core';

@Directive({
	standalone: true,
	selector: '[chKeysPressed]',
})
export class KeysPressedDirective {
	private pressedKeys: Set<string> = new Set<string>();

	@Input() keyCombinations: string[][] = [];

	@Output() keyCombinationPressed: EventEmitter<{
		pressedKeys: Array<string>;
		triggeredKeyCombination: Array<string>;
	}> = new EventEmitter<{
		pressedKeys: Array<string>;
		triggeredKeyCombination: Array<string>;
	}>();

	constructor() {}

	@HostListener('document:keydown', ['$event'])
	handleKeyDownEvent(event: KeyboardEvent) {
		this.pressedKeys.add(event.key.toLowerCase());
		this.checkMultiKeyPress();
	}

	@HostListener('document:keyup', ['$event'])
	handleKeyUpEvent(event: KeyboardEvent) {
		this.pressedKeys.delete(event.key.toLowerCase());
	}

	private checkMultiKeyPress(): void {
		// Check each provided key combination
		for (const keyCombination of this.keyCombinations) {
			if (this.isKeyCombinationPressed(keyCombination)) {
				this.keyCombinationPressed.emit({
					pressedKeys: Array.from(this.pressedKeys),
					triggeredKeyCombination: keyCombination,
				});
				return;
			}
		}
	}

	private isKeyCombinationPressed(keys: string[]): boolean {
		return keys.every((key) =>
			this.pressedKeys.has(key.toLowerCase())
		);
	}
}
