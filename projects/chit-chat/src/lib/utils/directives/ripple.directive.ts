import { DOCUMENT } from '@angular/common';
import {
	AfterViewInit,
	Directive,
	ElementRef,
	Inject,
	Input,
	NgZone,
	OnDestroy,
	Renderer2,
} from '@angular/core';

@Directive({
	selector: '[chRipple]',
	standalone: true,
	host: {
		class: 'ch-ripple',
	},
})
export class RippleDirective implements AfterViewInit, OnDestroy {
	@Input() rippleEnabled: boolean = true;

	private hostEl: HTMLElement;
	private pointerDownListener?: () => void;
	private inkElement?: HTMLElement;

	constructor(
		private renderer: Renderer2,
		private el: ElementRef,
		private zone: NgZone,
		@Inject(DOCUMENT) private document: Document
	) {
		this.hostEl = el.nativeElement as HTMLElement;
	}

	ngAfterViewInit() {
		this.zone.runOutsideAngular(() => {
			this.pointerDownListener = this.renderer.listen(
				this.el.nativeElement,
				'pointerdown',
				this.onPointerDown.bind(this)
			);
		});
	}

	ngOnDestroy() {
		this.removeInkElement();
		if (this.pointerDownListener) {
			this.pointerDownListener();
		}
	}

	private createInkElement() {
		this.removeInkElement();
		this.inkElement = this.renderer.createElement('span');
		this.renderer.addClass(this.inkElement, 'ch-ink');
		this.renderer.appendChild(this.hostEl, this.inkElement);
		this.renderer.setAttribute(
			this.inkElement,
			'aria-hidden',
			'true'
		);
		this.renderer.setAttribute(
			this.inkElement,
			'role',
			'presentation'
		);

		this.renderer.listen(this.inkElement, 'animationend', () => {
			if (this.inkElement) {
				this.renderer.removeClass(this.inkElement, 'ch-ink-animate');
			}
		});
	}

	private removeInkElement() {
		if (this.inkElement) {
			this.renderer.removeChild(this.hostEl, this.inkElement);
			this.inkElement = undefined;
		}
	}

	private onPointerDown(evt: MouseEvent) {
		if (!this.rippleEnabled) return;

		this.createInkElement();
		if (!this.inkElement) return;

		const diameter = Math.max(
			this.hostEl.offsetWidth,
			this.hostEl.offsetHeight
		);
		this.renderer.setStyle(this.inkElement, 'width', `${diameter}px`);
		this.renderer.setStyle(
			this.inkElement,
			'height',
			`${diameter}px`
		);

		const rect = this.hostEl.getBoundingClientRect();
		const scrollLeft =
			this.document.documentElement.scrollLeft ||
			this.document.body.scrollLeft;
		const scrollTop =
			this.document.documentElement.scrollTop ||
			this.document.body.scrollTop;

		const x =
			evt.pageX -
			rect.left -
			scrollLeft -
			this.inkElement.offsetWidth / 2;
		const y =
			evt.pageY -
			rect.top -
			scrollTop -
			this.inkElement.offsetHeight / 2;

		this.renderer.setStyle(this.inkElement, 'top', `${y}px`);
		this.renderer.setStyle(this.inkElement, 'left', `${x}px`);
		this.renderer.addClass(this.inkElement, 'ch-ink-animate');
	}
}
