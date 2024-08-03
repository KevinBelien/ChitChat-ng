import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	inject,
	Input,
	Output,
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

	@Input()
	emojiCategories: EmojiCategory[] = [...emojiCategories];

	readonly emojiCategoryIcons = emojiCategoryIcons;

	categoryHovered: EmojiCategory | null = null;

	@Input()
	selectedTab: EmojiCategory = this.emojiCategories[0];

	@Output()
	onTabClicked = new EventEmitter<EmojiCategory>();

	readonly isMobile = this.screenService.isMobile();

	trackCategory = (index: number, category: EmojiCategory) => {
		return category;
	};

	handleHoverChange = (e: HoverEvent, category: EmojiCategory) => {
		if (e.isHovered) this.categoryHovered = category;
		else if (this.categoryHovered === category)
			this.categoryHovered = null;
	};

	handleCategoryButtonClick = (
		e: MouseEvent,
		category: EmojiCategory
	) => {
		this.selectedTab = category;
		this.onTabClicked.emit(category);
	};
}
