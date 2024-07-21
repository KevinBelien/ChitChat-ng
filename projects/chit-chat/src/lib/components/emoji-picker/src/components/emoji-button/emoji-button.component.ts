import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	Input,
} from '@angular/core';
import { Emoji } from '../../interfaces';

import { RippleDirective } from 'chit-chat/src/lib/utils';

@Component({
	selector: 'ch-emoji-button',
	standalone: true,
	imports: [CommonModule, RippleDirective],
	templateUrl: './emoji-button.component.html',
	styleUrl: './emoji-button.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class EmojiButtonComponent {
	@Input()
	emoji?: Emoji;

	constructor() {}
}
