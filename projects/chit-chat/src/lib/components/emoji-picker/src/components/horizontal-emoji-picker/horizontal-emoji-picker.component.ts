import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';

import { ClickTouchHoldDirective } from 'chit-chat/src/lib/utils';

@Component({
	selector: 'ch-horizontal-emoji-picker',
	standalone: true,
	imports: [
		CommonModule,
		ScrollingModule,
		ClickTouchHoldDirective,
		EmojiButtonComponent,
	],
	templateUrl: './horizontal-emoji-picker.component.html',
	styleUrl: './horizontal-emoji-picker.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class HorizontalEmojiPickerComponent {}
