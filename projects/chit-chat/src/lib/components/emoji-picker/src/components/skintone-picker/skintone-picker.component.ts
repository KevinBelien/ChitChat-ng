import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	HostBinding,
	Input,
	model,
	output,
	signal,
} from '@angular/core';
import {
	Skintone,
	SkintoneColor,
	skintoneColors,
} from '../../models';

@Component({
	selector: 'ch-skintone-picker',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule],
	templateUrl: './skintone-picker.component.html',
	styleUrl: './skintone-picker.component.scss',
})
export class SkintonePickerComponent {
	isOpen = signal<boolean>(false);

	readonly skintoneColors: SkintoneColor[] = [...skintoneColors];

	selectedSkintone = model<Skintone>('default');

	@Input()
	@HostBinding('style.--ch-skincolor-swatch-size')
	size = 20;

	@HostBinding('style.--ch-skincolor-swatch-padding')
	itemPadding: number = 12;

	@HostBinding('style.--ch-skincolor-swatch-count')
	skintoneCount: number = this.skintoneColors.length;

	onSelectionChanged = output<Skintone>();

	selectedColor = computed(() => {
		return this.getColorBySkintone(this.selectedSkintone());
	});

	getColorBySkintone = (skintone: Skintone): SkintoneColor => {
		return (
			this.skintoneColors.find(
				(color) => color.skintone === skintone
			) ?? this.skintoneColors[0]
		);
	};

	toggle() {
		this.isOpen.set(!this.isOpen());
	}

	close = () => {
		this.isOpen.set(false);
	};

	handleClick = (skintoneColor: SkintoneColor, event: Event) => {
		event.stopPropagation();

		if (!!this.isOpen()) {
			this.selectedSkintone.set(skintoneColor.skintone);
			this.onSelectionChanged.emit(skintoneColor.skintone);
		}
		this.toggle();
	};

	getPosition = (index: number) => {
		if (!this.isOpen()) return 'translateX(0px)';

		const position = -(index * (this.size + this.itemPadding));
		return `translateX(${position}px) ${
			this.selectedColor() === this.skintoneColors[index]
				? 'scale(1.2)'
				: ''
		}`;
	};
}
