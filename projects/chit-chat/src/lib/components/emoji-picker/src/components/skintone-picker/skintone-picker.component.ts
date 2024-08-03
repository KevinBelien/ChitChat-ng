import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	inject,
	Input,
	Renderer2,
} from '@angular/core';
import { AlternativeSkintone, Emoji } from '../../models';
import { EmojiPickerStateService } from '../../services/emoji-picker-state.service';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';

@Component({
	selector: 'lib-skintone-picker',
	standalone: true,
	imports: [CommonModule, EmojiButtonComponent],
	templateUrl: './skintone-picker.component.html',
	styleUrl: './skintone-picker.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class SkintonePickerComponent {
	private emojiPickerStateService = inject(EmojiPickerStateService);
	private renderer = inject(Renderer2);

	@Input()
	emoji?: Emoji;

	@HostBinding('style.--emoji-size') emojiSizeInPx?: string;

	@HostBinding('style.--item-size-multiplier')
	itemSizeMultiplier?: number;

	constructor() {
		this.emojiPickerStateService.emojiSizeInPx$.subscribe(
			(emojiSizeInPx) => {
				this.emojiSizeInPx = `${emojiSizeInPx}px`;
			}
		);
		this.emojiPickerStateService.emojiItemSizeMultiplier$.subscribe(
			(emojiContainerSizeMultiplier) => {
				this.itemSizeMultiplier = emojiContainerSizeMultiplier;
			}
		);

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
}
