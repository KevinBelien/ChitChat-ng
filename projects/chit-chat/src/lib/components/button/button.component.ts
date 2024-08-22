import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
} from '@angular/core';
import { IconComponent } from 'chit-chat/src/lib/components/icon';
import { RippleDirective } from 'chit-chat/src/lib/utils';
import { ButtonIconProps, ButtonShape, ButtonType } from './models';
import { ButtonFill } from './models/button-fill.type';

@Component({
	selector: 'ch-button',
	standalone: true,
	imports: [CommonModule, IconComponent, RippleDirective],
	templateUrl: './button.component.html',
	styleUrls: ['./button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
		'[class.ch-disabled]': 'disabled()',
	},
})
export class ButtonComponent {
	label = input<string>();
	icon = input<Partial<ButtonIconProps>>();
	cssClass = input<string>();
	width = input<number>();
	height = input<number>();
	disabled = input<boolean>(false);
	activeStateEnabled = input<boolean>(true);
	focusStateEnabled = input<boolean>(true);
	hoverStateEnabled = input<boolean>(true);
	type = input<ButtonType>('primary');
	fill = input<ButtonFill>('solid');
	raised = input<boolean>(false);
	shape = input<ButtonShape>('square');
	tabIndex = input<number | null>(null);
	ariaLabel = input<string>();

	iconPosition = computed(() => {
		const icon = this.icon();
		if (!!icon && 'position' in icon) {
			return icon.position;
		}

		return 'left';
	});

	iconClass = computed(() => {
		return {
			'ch-button-icon': true,
			'ch-button-icon-left':
				this.iconPosition() === 'left' && this.label(),
			'ch-button-icon-right':
				this.iconPosition() === 'right' && this.label(),
			'ch-button-icon-top':
				this.iconPosition() === 'top' && this.label(),
			'ch-button-icon-bottom':
				this.iconPosition() === 'bottom' && this.label(),
		};
	});

	buttonClass = computed(() => {
		const extraClasses = this.cssClass();

		return {
			'ch-element ch-button': true,
			'ch-button-icon-only': !!this.icon() && !this.label(),
			'ch-button-vertical':
				(this.iconPosition() === 'top' ||
					this.iconPosition() === 'bottom') &&
				this.label,

			[`ch-button-${this.type()}`]: true,
			'ch-button-raised': this.raised(),
			'ch-button-rounded': this.shape() === 'round',
			[`ch-button-${this.fill()}`]: true,
			['ch-hover-state-disabled']: !this.hoverStateEnabled(),
			['ch-focus-state-disabled']: !this.focusStateEnabled(),
			['ch-active-state-disabled']: !this.activeStateEnabled(),

			...(!!extraClasses ? { [extraClasses]: true } : undefined),
		};
	});

	onClick = output<MouseEvent>();

	handleClick = (evt: MouseEvent) => {
		this.onClick.emit(evt);
	};
}
