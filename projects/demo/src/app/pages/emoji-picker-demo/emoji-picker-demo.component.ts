import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
	emojiCategories,
	EmojiCategory,
	EmojiPickerComponent,
} from 'chit-chat/src/lib/components/emoji-picker';
import { EmojiSizeKey } from 'chit-chat/src/lib/components/emoji-picker/src/enums/emoji-size.enum';

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

	form: { emojiSize: EmojiSizeKey; categories: EmojiCategory[] } = {
		emojiSize: 'default',
		categories: [...emojiCategories],
	};

	emojiSizes: EmojiSizeKey[] = ['default', 'xs', 'sm', 'lg', 'xl'];
}
