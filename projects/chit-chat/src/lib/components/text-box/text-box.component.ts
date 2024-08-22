import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	ElementRef,
	forwardRef,
	HostListener,
	inject,
	input,
	model,
	OnDestroy,
	output,
	Renderer2,
	untracked,
} from '@angular/core';
import {
	ControlValueAccessor,
	NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { ButtonComponent } from 'chit-chat/src/lib/components/button';
import { IconComponent } from 'chit-chat/src/lib/components/icon';
import { AutofocusDirective } from 'chit-chat/src/lib/utils';
import { icons } from './icons';
import { ValueChangeEvent } from './models';
import { TextBoxMode } from './models/text-box-mode.type';
import { TextBoxVariant } from './models/text-box-variant.type';

@Component({
	selector: 'ch-text-box',
	standalone: true,
	imports: [
		CommonModule,
		IconComponent,
		AutofocusDirective,
		ButtonComponent,
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TextBoxComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './text-box.component.html',
	styleUrls: ['./text-box.component.scss'],
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class TextBoxComponent
	implements ControlValueAccessor, AfterViewInit, OnDestroy
{
	private elementRef = inject(ElementRef);
	private renderer = inject(Renderer2);

	/**
	 * The input's current value
	 * @group Props
	 */
	value = model<string>('');
	autofocus = input<boolean>(false);
	mode = input<TextBoxMode>('text');
	valueChangeEvent = input<string>('change');
	placeholder = input<string>('');
	disabled = input<boolean>(false);
	variant = input<TextBoxVariant>('filled');
	showClearButton = input<boolean>(false);

	onValueChanged = output<ValueChangeEvent>();

	textBoxClass = computed(() => {
		return {
			'ch-editor-outlined': this.variant() === 'outlined',
			'ch-editor-filled': this.variant() === 'filled',
		};
	});

	readonly icons = { ...icons };

	private currentListenerFn: () => void = () => {};
	private elementClickListener: () => void = () => {};

	private onChange: (value: string) => void = () => {};
	private onTouched: () => void = () => {};

	@HostListener('blur', ['$event'])
	onBlur(event: FocusEvent): void {
		this.onTouched();
	}

	constructor() {
		effect(() => {
			const valueChangeEvent = this.valueChangeEvent();
			untracked(() => this.updateEventListener(valueChangeEvent));
		});
	}

	ngAfterViewInit(): void {
		this.elementClickListener = this.renderer.listen(
			this.elementRef.nativeElement,
			'pointerdown',
			(event: Event) => {
				this.handleElementClick(event);
			}
		);
	}

	handleElementClick(event: Event): void {
		const inputElement =
			this.elementRef.nativeElement.querySelector('input');

		if (event.target !== inputElement) {
			event.preventDefault();
			inputElement.focus();
		}
	}

	ngOnDestroy(): void {
		this.cleanupCurrentListener();

		if (!!this.elementClickListener) {
			this.elementClickListener();
		}
	}

	writeValue(value: string): void {
		this.value.set(value || '');
	}

	protected handleClearClick = (evt: MouseEvent) => {
		this.value.set('');
		this.setValue(this.value(), evt, 'clear');
	};

	registerOnChange(fn: (value: string) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	private cleanupCurrentListener = () => {
		if (this.currentListenerFn) {
			this.currentListenerFn();
		}
	};

	private updateEventListener(valueChangeEvent: string): void {
		this.cleanupCurrentListener();

		this.currentListenerFn = this.renderer.listen(
			this.elementRef.nativeElement.querySelector('input'),
			valueChangeEvent,
			(event: Event) => this.onEvent(event)
		);
	}

	onEvent = (evt: Event): void => {
		const inputElement = evt.target as HTMLInputElement;

		this.setValue(inputElement.value, evt, this.valueChangeEvent());
	};

	private setValue = (value: string, evt: Event, action: string) => {
		this.onChange(value);
		this.value.set(value); // Update internal value
		this.onValueChanged.emit({
			event: evt,
			value: value,
			action,
		});
	};
}
