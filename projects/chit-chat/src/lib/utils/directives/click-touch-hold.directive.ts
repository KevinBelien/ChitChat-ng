import {
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	OnDestroy,
	OnInit,
	Output,
	Renderer2,
} from '@angular/core';
import { Subject, fromEvent, timer } from 'rxjs';
import {
	debounceTime,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs/operators';
import { ClickActionType, PointerDeviceType } from '../enums';
import { ClickEvent, TouchHoldEvent } from '../interfaces';

@Directive({
	selector: '[chClickTouchHold]',
	standalone: true,
})
export class ClickTouchHoldDirective implements OnInit, OnDestroy {
	@Input() touchHoldTimeInMillis = 750;
	@Input() preventContextMenu = true;
	@Input() dataAttribute?: string;
	@Output() onClick = new EventEmitter<ClickEvent>();
	@Output() onTouchHold = new EventEmitter<TouchHoldEvent>();

	private destroy$ = new Subject<void>();
	private pointerDown$ = new Subject<PointerEvent>();
	private pointerUp$ = new Subject<PointerEvent>();
	private pointerMove$ = new Subject<PointerEvent>();
	private touchMove$ = new Subject<TouchEvent>();
	private scroll$ = new Subject<void>();

	private pointerDownTarget: EventTarget | null = null;
	private pointerDownDataAttribute: string | null = null;
	private hasPointerExited = false;

	private eventListeners: Array<() => void> = [];

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer2
	) {}

	ngOnInit(): void {
		this.addEventListeners();

		this.pointerDown$
			.pipe(
				switchMap((event) =>
					timer(this.touchHoldTimeInMillis).pipe(
						takeUntil(this.pointerUp$),
						takeUntil(this.pointerMove$),
						takeUntil(this.touchMove$),
						takeUntil(this.scroll$),
						tap(() => this.handleTouchHold(event))
					)
				),
				takeUntil(this.destroy$)
			)
			.subscribe();

		this.pointerUp$
			.pipe(
				tap((event) => this.handlePointerUp(event)),
				takeUntil(this.destroy$)
			)
			.subscribe();
	}

	ngOnDestroy(): void {
		this.removeEventListeners();
		this.destroy$.next();
		this.destroy$.complete();
	}

	private addEventListeners = (): void => {
		const nativeElement = this.elementRef.nativeElement;

		this.eventListeners = [
			this.renderer.listen(
				nativeElement,
				'pointerdown',
				(event: PointerEvent) => this.onPointerDown(event)
			),
			this.renderer.listen(
				nativeElement,
				'pointerup',
				(event: PointerEvent) => this.onPointerUp(event)
			),

			this.renderer.listen(nativeElement, 'scroll', () =>
				this.scroll$.next()
			),

			this.renderer.listen(
				nativeElement,
				'keyup',
				(event: KeyboardEvent) => this.onKeyUp(event)
			),
		];

		fromEvent<PointerEvent>(nativeElement, 'pointermove')
			.pipe(debounceTime(50), takeUntil(this.destroy$))
			.subscribe((e: PointerEvent) => this.onPointerMove(e));

		fromEvent<TouchEvent>(nativeElement, 'touchmove')
			.pipe(debounceTime(50), takeUntil(this.destroy$))
			.subscribe((e: TouchEvent) => this.onTouchMove(e));

		if (this.preventContextMenu) {
			this.eventListeners.push(
				this.renderer.listen(
					nativeElement,
					'contextmenu',
					(event: MouseEvent) => event.preventDefault()
				)
			);
		}
	};

	private removeEventListeners = (): void => {
		this.eventListeners.forEach((unlisten) => unlisten());
	};

	private onPointerDown = (event: PointerEvent): void => {
		if (!this.isPointerDownValid(event) || !event.target) return;

		const targetElement = this.findElementByAttribute(
			event.target as HTMLElement
		);
		if (targetElement) {
			this.pointerDownTarget = targetElement;
			this.pointerDownDataAttribute =
				this.getAttributeValue(targetElement);
			this.hasPointerExited = false;
			this.pointerDown$.next(event);
		}
	};

	private onPointerUp = (event: PointerEvent): void => {
		if (this.isPointerUpValid(event)) this.pointerUp$.next(event);

		this.pointerDownTarget = null;
		this.pointerDownDataAttribute = null;
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (!event.target || !this.pointerDownTarget) return;

		const targetElement = this.findElementByAttribute(
			event.target as HTMLElement
		);
		if (!targetElement || this.isOutOfBounds(targetElement)) {
			this.hasPointerExited = true;
			this.pointerMove$.next(event);
		}
	};

	private onTouchMove = (event: TouchEvent): void => {
		if (!this.pointerDownTarget) return;
		let targetElement = document.elementFromPoint(
			event.touches[0].clientX,
			event.touches[0].clientY
		) as HTMLElement | null;

		if (!targetElement) return;

		targetElement = this.findElementByAttribute(targetElement);

		if (!targetElement || this.isOutOfBounds(targetElement)) {
			this.hasPointerExited = true;
			this.touchMove$.next(event);
		}
	};

	private onKeyUp = (event: KeyboardEvent): void => {
		if (!event.target) return;

		const targetElement = this.findElementByAttribute(
			event.target as HTMLElement
		);
		if (this.isClickTriggerKey(event.key) && targetElement) {
			const data = this.getAttributeValue(targetElement);
			this.onClick.emit({
				event,
				data,
				action:
					event.key === 'Enter'
						? ClickActionType.ENTER
						: ClickActionType.SPACE,
			});
		}
	};

	private handleTouchHold = (event: PointerEvent): void => {
		if (!event.target) return;

		const targetElement = this.findElementByAttribute(
			event.target as HTMLElement
		);
		if (!targetElement) return;

		const data = this.getAttributeValue(targetElement);
		if (
			!this.hasPointerExited &&
			this.isTargetDataAttributeMatch(targetElement, data)
		) {
			this.onTouchHold.emit({ event, data });
		}
	};

	private handlePointerUp = (event: PointerEvent): void => {
		if (!event.target) return;

		const targetElement = this.findElementByAttribute(
			event.target as HTMLElement
		);
		if (!targetElement) return;

		const data = this.getAttributeValue(targetElement);
		if (!this.hasPointerExited) {
			this.onClick.emit({
				event,
				data,
				pointerType: event.pointerType as PointerDeviceType,
				action:
					event.pointerType === PointerDeviceType.MOUSE
						? event.button === 0
							? ClickActionType.LEFTCLICK
							: ClickActionType.RIGHTCLICK
						: undefined,
			});
		}
	};

	private findElementByAttribute = (
		targetElement: HTMLElement
	): HTMLElement | null => {
		while (
			targetElement &&
			this.dataAttribute &&
			!targetElement.hasAttribute(this.dataAttribute) &&
			targetElement.parentElement
		) {
			targetElement = targetElement.parentElement;
		}
		return targetElement;
	};

	private getAttributeValue = (
		targetElement: HTMLElement
	): string | null => {
		if (!targetElement || !this.dataAttribute) return null;
		const elementWithAttribute =
			this.findElementByAttribute(targetElement);
		return elementWithAttribute
			? elementWithAttribute.getAttribute(this.dataAttribute)
			: null;
	};

	private isTargetDataAttributeMatch = (
		targetElement: HTMLElement,
		data?: string | null
	): boolean => {
		return (
			!this.dataAttribute ||
			(targetElement.hasAttribute(this.dataAttribute) &&
				this.pointerDownDataAttribute === data)
		);
	};

	private isOutOfBounds = (targetElement: HTMLElement): boolean => {
		return (
			!!this.pointerDownTarget &&
			(!this.elementRef.nativeElement.contains(targetElement) ||
				(!!this.dataAttribute &&
					targetElement.hasAttribute(this.dataAttribute) &&
					this.pointerDownDataAttribute !==
						targetElement.getAttribute(this.dataAttribute)))
		);
	};

	private isPointerDownValid = (event: PointerEvent): boolean => {
		return (
			(event.pointerType === PointerDeviceType.MOUSE &&
				[0, 2].includes(event.button)) ||
			(event.pointerType !== PointerDeviceType.MOUSE &&
				event.button === 0)
		);
	};

	private isPointerUpValid = (event: PointerEvent): boolean => {
		const targetElement = this.findElementByAttribute(
			event.target as HTMLElement
		);
		if (!targetElement) return false;

		const pointerUpDataAttribute =
			this.getAttributeValue(targetElement);
		return (
			this.pointerDownDataAttribute === pointerUpDataAttribute &&
			!this.hasPointerExited
		);
	};

	private isClickTriggerKey = (key: string): boolean =>
		['ENTER', ' '].includes(key.toUpperCase());
}
