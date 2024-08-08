import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	HostBinding,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
export class SkintonePickerComponent implements OnChanges {
	isOpen$ = new BehaviorSubject<boolean>(false);

	skintoneColors = [...skintoneColors];

	@Input()
	selectedSkintone: Skintone = 'default';

	@Input()
	@HostBinding('style.--ch-skincolor-swatch-size')
	size: number = 20;

	@HostBinding('style.--ch-skincolor-swatch-padding')
	itemPadding: number = 12;

	@HostBinding('style.--ch-skincolor-swatch-count')
	skintoneCount: number = this.skintoneColors.length;

	@Output()
	onSelectionChanged = new EventEmitter<Skintone>();

	selectedColor: SkintoneColor = this.skintoneColors[0];

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['selectedSkintone']) {
			this.selectedColor = this.getColorBySkintone(
				changes['selectedSkintone'].currentValue
			);
		}
	}

	getColorBySkintone = (skintone: Skintone): SkintoneColor => {
		return (
			this.skintoneColors.find(
				(color) => color.skintone === skintone
			) ?? this.skintoneColors[0]
		);
	};

	toggle() {
		this.isOpen$.next(!this.isOpen$.getValue());
	}

	close = () => {
		this.isOpen$.next(false);
	};

	handleClick = (skintoneColor: SkintoneColor, event: Event) => {
		event.stopPropagation();

		if (this.isOpen$.getValue()) {
			this.selectedColor = skintoneColor;
			this.onSelectionChanged.emit(skintoneColor.skintone);
		}
		this.toggle();
	};

	getPosition = (index: number) => {
		if (!this.isOpen$.getValue()) return 'translateX(0px)';

		const position = -(index * (this.size + this.itemPadding));
		return `translateX(${position}px) ${
			this.selectedColor === this.skintoneColors[index]
				? 'scale(1.2)'
				: ''
		}`;
	};
}
