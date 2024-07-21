import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	Input,
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
	@Input()
	iconPath: string = '';

	@Input()
	height: number | string = 24;

	@Input()
	width: number | string = 24;

	@Input()
	viewBox: string = '0 -960 960 960';
}
