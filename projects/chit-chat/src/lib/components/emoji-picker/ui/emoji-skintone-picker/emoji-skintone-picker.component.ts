import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	inject,
	Input,
	model,
	output,
	Renderer2,
} from '@angular/core';
import {
	ClickEvent,
	ClickTouchHoldDirective,
} from '@chit-chat/ng-chat/src/lib/utils';
import { Emoji } from '../../models';
import { EmojiPickerService } from '../../services';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';

@Component({
	selector: 'ch-emoji-skintone-picker',
	standalone: true,
	imports: [
		CommonModule,
		EmojiButtonComponent,
		ClickTouchHoldDirective,
	],
	templateUrl: './emoji-skintone-picker.component.html',
	styleUrl: './emoji-skintone-picker.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class EmojiSkintonePickerComponent {
	private emojiPickerService = inject(EmojiPickerService);
	private renderer = inject(Renderer2);

	emoji = model<Emoji | null>(null);

	@Input()
	@HostBinding('style.--ch-emoji-fontsize')
	emojiSizeInPx?: number;

	@Input()
	@HostBinding('style.--ch-emoji-buttonsize')
	emojiButtonSizeInPx?: number;

	onSelectionChanged = output<ClickEvent>();

	constructor() {
		this.disableContextMenu();
	}

	private disableContextMenu = () => {
		const overlayElement = document.querySelector(
			'.cdk-overlay-container'
		) as HTMLElement;
		if (overlayElement) {
			this.renderer.listen(
				overlayElement,
				'contextmenu',
				(event: MouseEvent) => event.preventDefault()
			);
		}
	};

	protected handleEmojiClick = (evt: ClickEvent) => {
		if (evt.action === 'right-click') return;
		this.onSelectionChanged.emit(evt);
	};
}
