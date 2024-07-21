import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { ButtonComponent } from 'chit-chat/src/lib/components/button';
import { IconComponent } from 'chit-chat/src/lib/components/icon';
import { HoverDirective, HoverEvent } from 'chit-chat/src/lib/utils';
import { emojiCategoryIcons } from '../../icons/emoji-categories';
import { EmojiCategory } from '../../interfaces';
import { emojiCategories } from './../../interfaces/emoji.interface';

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
})
export class EmojiTabsComponent {
	@Input()
	emojiCategories: EmojiCategory[] = [...emojiCategories];

	readonly emojiCategoryIcons = emojiCategoryIcons;

	categoryHovered: EmojiCategory | null = null;

	@Input()
	selectedTab: EmojiCategory = this.emojiCategories[0];

	@Output()
	onTabClicked = new EventEmitter<EmojiCategory>();

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
