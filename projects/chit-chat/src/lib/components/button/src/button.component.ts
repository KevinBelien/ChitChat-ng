import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { IconComponent } from 'chit-chat/src/lib/components/icon';
import { RippleDirective } from 'chit-chat/src/lib/utils';
import { ButtonShape, ButtonType } from './types';
import { ButtonFill } from './types/button-fill.type';
import { IconPosition } from './types/icon-position.type';

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
		'[class.ch-disabled]': 'disabled',
	},
})
export class ButtonComponent {
	@Input() label?: string;
	@Input() icon?: string;
	@Input() cssClass?: string;
	@Input() width?: number;
	@Input() height?: number;
	@Input() disabled: boolean = false;
	@Input() activeStateEnabled: boolean = true;
	@Input() focusStateEnabled: boolean = true;
	@Input() hoverStateEnabled: boolean = true;
	@Input() type: ButtonType = 'primary';
	@Input() fill: ButtonFill = 'solid';
	@Input() iconPosition: IconPosition = 'left';
	@Input() raised: boolean = false;
	@Input() shape: ButtonShape = 'square';
	@Input() tabIndex: number | null = null;

	@Output() onClick = new EventEmitter<MouseEvent>();

	iconClass() {
		const iconClasses = {
			'ch-button-icon': true,
			'ch-button-icon-left':
				this.iconPosition === 'left' && this.label,
			'ch-button-icon-right':
				this.iconPosition === 'right' && this.label,
			'ch-button-icon-top': this.iconPosition === 'top' && this.label,
			'ch-button-icon-bottom':
				this.iconPosition === 'bottom' && this.label,
		};

		return iconClasses;
	}

	get buttonClass() {
		return {
			'ch-element ch-button': true,
			'ch-button-icon-only': this.icon && !this.label,
			'ch-button-vertical':
				(this.iconPosition === 'top' ||
					this.iconPosition === 'bottom') &&
				this.label,

			[`ch-button-${this.type}`]: true,
			'ch-button-raised': this.raised,
			'ch-button-rounded': this.shape === 'round',
			[`ch-button-${this.fill}`]: true,
			['ch-hover-state-disabled']: !this.hoverStateEnabled,
			['ch-focus-state-disabled']: !this.focusStateEnabled,
			['ch-active-state-disabled']: !this.activeStateEnabled,

			...(this.cssClass ? { [this.cssClass]: true } : undefined),
		};
	}

	handleClick = (e: MouseEvent) => {
		this.onClick.emit(e);
	};
}
