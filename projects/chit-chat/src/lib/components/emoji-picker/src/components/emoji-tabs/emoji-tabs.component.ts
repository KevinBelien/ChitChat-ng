import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	effect,
	EventEmitter,
	inject,
	input,
	Output,
	signal,
} from '@angular/core';
import { ButtonComponent } from 'chit-chat/src/lib/components/button';
import { IconComponent } from 'chit-chat/src/lib/components/icon';
import {
	HoverDirective,
	HoverEvent,
	ScreenService,
} from 'chit-chat/src/lib/utils';
import { emojiCategoryIcons } from '../../icons/emoji-categories';
import { emojiCategories, EmojiCategory } from '../../models';

@Component({
	selector: 'ch-emoji-tabs',
	standalone: true,
	imports: [
		CommonModule,
		HoverDirective,
		IconComponent,
		ButtonComponent,
	],
	templateUrl: './emoji-tabs.component.html',
	styleUrl: './emoji-tabs.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class EmojiTabsComponent {
	private screenService = inject(ScreenService);

	emojiCategories = input<EmojiCategory[]>([...emojiCategories]);

	selectedTab = input<EmojiCategory>(this.emojiCategories()[0]);

	internalSelectedTab = signal<EmojiCategory>(
		this.emojiCategories()[0]
	);

	readonly emojiCategoryIcons = emojiCategoryIcons;

	categoryHovered = signal<EmojiCategory | null>(null);

	@Output()
	onTabClicked = new EventEmitter<EmojiCategory>();

	constructor() {
		effect(
			() => {
				this.internalSelectedTab.set(this.selectedTab());
			},
			{
				allowSignalWrites: true,
			}
		);
	}
	readonly isMobile = this.screenService.isMobile();

	protected trackCategory = (
		index: number,
		category: EmojiCategory
	) => {
		return category;
	};

	protected handleHoverChange = (
		evt: HoverEvent,
		category: EmojiCategory
	) => {
		if (evt.isHovered) this.categoryHovered.set(category);
		else if (this.categoryHovered() === category)
			this.categoryHovered.set(null);
	};

	protected handleCategoryButtonClick = (
		evt: MouseEvent,
		category: EmojiCategory
	) => {
		this.internalSelectedTab.set(category);
		this.onTabClicked.emit(category);
	};
}
