import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
} from '@angular/core';

@Component({
	selector: 'ch-icon',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './icon.component.html',
	styleUrl: './icon.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class IconComponent {
	cssClass = input<string>('');

	iconPath = input<string>('');

	height = input<number | string>(24);

	width = input<number | string>(24);

	viewBox = input<string>('0 -960 960 960');
}
