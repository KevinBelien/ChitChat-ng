import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
	CategoryBarPosition,
	emojiCategories,
	EmojiCategory,
	EmojiPickerComponent,
	EmojiSizeKey,
	EmojiSuggestionMode,
} from 'chit-chat/src/lib/components/emoji-picker';

@Component({
	selector: 'app-emoji-picker-demo',
	standalone: true,
	imports: [
		CommonModule,
		EmojiPickerComponent,
		FormsModule,
		MatFormFieldModule,
		MatSelectModule,
	],
	templateUrl: './emoji-picker-demo.component.html',
	styleUrl: './emoji-picker-demo.component.scss',
})
export class EmojiPickerDemoComponent {
	categories = [...emojiCategories];

	form: {
		emojiSize: EmojiSizeKey;
		categories: EmojiCategory[];
		categoryBarPosition: CategoryBarPosition;
		suggestionMode: EmojiSuggestionMode;
	} = {
		emojiSize: 'default',
		categories: [...emojiCategories],
		categoryBarPosition: 'top',
		suggestionMode: 'recent',
	};

	emojiSizes: EmojiSizeKey[] = ['default', 'xs', 'sm', 'lg', 'xl'];
}
