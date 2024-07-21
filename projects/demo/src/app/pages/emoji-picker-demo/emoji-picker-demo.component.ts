import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmojiPickerComponent } from 'chit-chat/src/lib/components/emoji-picker';

@Component({
	selector: 'app-emoji-picker-demo',
	standalone: true,
	imports: [CommonModule, EmojiPickerComponent],
	templateUrl: './emoji-picker-demo.component.html',
	styleUrl: './emoji-picker-demo.component.scss',
})
export class EmojiPickerDemoComponent {}
