import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
	booleanAttribute,
	Directive,
	ElementRef,
	inject,
	Input,
	PLATFORM_ID,
} from '@angular/core';

@Directive({
	selector: '[chAutofocus]',
	standalone: true,
})
export class AutofocusDirective {
	@Input({ transform: booleanAttribute }) autofocus: boolean = false;

	focused: boolean = false;

	platformId = inject(PLATFORM_ID);

	document: Document = inject(DOCUMENT);

	host: ElementRef = inject(ElementRef);

	ngAfterContentChecked() {
		if (this.autofocus === false) {
			this.host.nativeElement.removeAttribute('autofocus');
		} else {
			this.host.nativeElement.setAttribute('autofocus', true);
		}

		if (!this.focused) {
			this.autoFocus();
		}
	}

	ngAfterViewChecked() {
		if (!this.focused) {
			this.autoFocus();
		}
	}

	autoFocus() {
		if (isPlatformBrowser(this.platformId) && this.autofocus) {
			setTimeout(() => {
				const focusableElements = this.getFocusableElements(
					this.host?.nativeElement
				);

				if (focusableElements.length === 0) {
					this.host.nativeElement.focus();
				}
				if (focusableElements.length > 0) {
					focusableElements[0].focus();
				}

				this.focused = true;
			});
		}
	}

	getFocusableElements(element: HTMLElement): HTMLElement[] {
		const selectors = [
			'a[href]',
			'area[href]',
			'input:not([disabled]):not([type="hidden"])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'button:not([disabled])',
			'iframe',
			'object',
			'embed',
			'[contenteditable]',
			'[tabindex]:not([tabindex="-1"])',
		];

		const focusableElements = Array.from(
			element.querySelectorAll<HTMLElement>(selectors.join(','))
		);

		// Filter out elements that are not actually visible or cannot be focused
		const visibleFocusableElements = focusableElements.filter(
			(el) => {
				return this.isVisible(el);
			}
		);

		// If there are visible focusable elements, return them
		if (visibleFocusableElements.length > 0) {
			return visibleFocusableElements;
		}

		// If no focusable elements found, check recursively in child elements
		for (let i = 0; i < element.children.length; i++) {
			const child = element.children[i] as HTMLElement;
			const childFocusableElements = this.getFocusableElements(child);
			if (childFocusableElements.length > 0) {
				return childFocusableElements;
			}
		}

		return [];
	}

	private isVisible(element: HTMLElement): boolean {
		const style = window.getComputedStyle(element);
		return style.display !== 'none' && style.visibility !== 'hidden';
	}
}
