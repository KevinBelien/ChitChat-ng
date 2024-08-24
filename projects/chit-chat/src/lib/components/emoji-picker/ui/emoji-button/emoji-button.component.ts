import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
} from '@angular/core';

import { RippleDirective } from '@chit-chat/ng-chat/src/lib/utils';

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
	emoji = input<string>();

	showSkintoneIndicator = input<boolean>(false);
}
