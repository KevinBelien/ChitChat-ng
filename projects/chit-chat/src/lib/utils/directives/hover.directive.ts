import {
	Directive,
	EventEmitter,
	HostListener,
	Output,
} from '@angular/core';
import { HoverEvent } from '../interfaces';

@Directive({
	standalone: true,
	selector: '[chHover]',
})
export class HoverDirective {
	@Output() hoverChange = new EventEmitter<HoverEvent>();

	@HostListener('mouseenter') onMouseEnter = (event: Event) => {
		this.hoverChange.emit({ event, isHovered: true });
	};

	@HostListener('mouseleave') onMouseLeave = (event: Event) => {
		this.hoverChange.emit({ event, isHovered: false });
	};
}
