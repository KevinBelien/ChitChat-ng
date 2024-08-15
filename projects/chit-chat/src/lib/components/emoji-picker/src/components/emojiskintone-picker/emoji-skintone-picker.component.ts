import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	effect,
	HostBinding,
	inject,
	Input,
	model,
	output,
	Renderer2,
	ViewEncapsulation,
} from '@angular/core';
import {
	ClickEvent,
	ClickTouchHoldDirective,
} from 'chit-chat/src/lib/utils';
import { AlternativeSkintone, Emoji } from '../../models';
import { EmojiPickerStateService } from '../../services/emoji-picker-state.service';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';

@Component({
	selector: 'lib-skintone-picker',
	standalone: true,
	imports: [
		CommonModule,
		EmojiButtonComponent,
		ClickTouchHoldDirective,
	],
	templateUrl: './emoji-skintone-picker.component.html',
	styleUrl: './emoji-skintone-picker.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,

	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class EmojiSkintonePickerComponent {
	private emojiPickerStateService = inject(EmojiPickerStateService);
	private renderer = inject(Renderer2);

	emoji = model<Emoji>();

	@Input()
	@HostBinding('style.--ch-emoji-size')
	emojiSizeInPx?: number;

	@HostBinding('style.--ch-emoji-btn-size-multiplier')
	itemSizeMultiplier?: number;

	onSelectionChanged = output<ClickEvent>();

	constructor() {
		effect(() => {
			this.itemSizeMultiplier =
				this.emojiPickerStateService.emojiItemSizeMultiplier();
		});

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

	protected trackSkintone = (
		index: number,
		skintone: AlternativeSkintone
	) => {
		return skintone.skintone;
	};

	protected handleEmojiClick = (evt: ClickEvent) => {
		if (evt.action === 'right-click') return;
		this.onSelectionChanged.emit(evt);
	};
}
