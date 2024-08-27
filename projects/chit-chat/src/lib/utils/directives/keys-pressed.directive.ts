import {
	Directive,
	HostListener,
	input,
	output,
} from '@angular/core';
import { KeyPressedEvent } from '../models';

/**
 * A directive that detects when specific combinations of keys are pressed simultaneously.
 * It allows you to specify multiple key combinations and emits an event when any of them are triggered.
 * @directive
 * @selector [chKeysPressed]
 */
@Directive({
	standalone: true,
	selector: '[chKeysPressed]',
})
export class KeysPressedDirective {
	private pressedKeys: Set<string> = new Set<string>();

	/**
	 * An array of key combinations that the directive should listen for.
	 * Each key combination is represented as an array of strings, where each string is a key name.
	 * @group Props
	 * @default []
	 */
	keyCombinations = input<string[][]>([]);

	/**
	 * Event emitted when one of the specified key combinations is pressed.
	 * @group Outputs
	 * @type {EventEmitter<KeyPressedEvent>} - Holds pressed keys and what combinations where triggered
	 */
	keyCombinationPressed = output<KeyPressedEvent>();

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
		for (const keyCombination of this.keyCombinations()) {
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
