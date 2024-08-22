import {
	Overlay,
	OverlayRef,
	PositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	ElementRef,
	HostBinding,
	inject,
	Input,
	input,
	model,
	OnDestroy,
	OnInit,
	output,
	Renderer2,
	signal,
	viewChild,
} from '@angular/core';

import {
	takeUntilDestroyed,
	toObservable,
	toSignal,
} from '@angular/core/rxjs-interop';

import {
	TextBoxComponent,
	ValueChangeEvent,
} from 'chit-chat/src/lib/components/text-box';
import {
	TranslatePipe,
	TranslationService,
} from 'chit-chat/src/lib/localization';
import {
	ClickActionType,
	ClickEvent,
	TouchHoldEvent,
} from 'chit-chat/src/lib/utils';
import {
	debounce,
	distinctUntilChanged,
	filter,
	from,
	map,
	Observable,
	of,
	shareReplay,
	startWith,
	switchMap,
	timer,
} from 'rxjs';
import { emojis } from './data';
import { EmojiDataHelper } from './helpers';
import {
	Emoji,
	emojiCategories,
	EmojiCategory,
	EmojiSizeOption,
	Skintone,
	SkintoneSetting,
} from './models';
import { CategoryBarPosition } from './models/category-bar-position.model';
import { EmojiSuggestionMode } from './models/emoji-suggestion-mode.model';
import { FilteredEmojis } from './models/filtered-emojis.model';
import { EmojiDataService, EmojiPickerService } from './services';
import { EmojiFilterService } from './services/emoji-filter.service';
import { EmojiSkintonePickerComponent } from './ui/emoji-skintone-picker/emoji-skintone-picker.component';
import { EmojiTabsComponent } from './ui/emoji-tabs/emoji-tabs.component';
import { EmojiViewportComponent } from './ui/emoji-viewport/emoji-viewport.component';
import { HorizontalEmojiPickerComponent } from './ui/horizontal-emoji-picker/horizontal-emoji-picker.component';
import { SkintoneSwatchPickerComponent } from './ui/skintone-swatch-picker/skintone-swatch-picker.component';

@Component({
	selector: 'ch-emoji-picker',
	standalone: true,
	imports: [
		CommonModule,
		EmojiViewportComponent,
		HorizontalEmojiPickerComponent,
		EmojiTabsComponent,
		SkintoneSwatchPickerComponent,
		TextBoxComponent,
		TranslatePipe,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './emoji-picker.component.html',
	styleUrl: './emoji-picker.component.scss',
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class EmojiPickerComponent implements OnInit, OnDestroy {
	private emojiDataService = inject(EmojiDataService);
	private emojiFilterService = inject(EmojiFilterService);
	private renderer = inject(Renderer2);
	private elementRef = inject(ElementRef);
	private overlay = inject(Overlay);
	private emojiPickerService = inject(EmojiPickerService);
	private translationService = inject(TranslationService);

	emojiViewportComponent = viewChild<EmojiViewportComponent>(
		EmojiViewportComponent
	);

	swatchPickerComponent = viewChild<SkintoneSwatchPickerComponent>(
		SkintoneSwatchPickerComponent
	);

	/**
	 * Height of the emoji picker
	 * @group Props
	 */
	@Input()
	@HostBinding('style.--picker-height')
	height = 450;

	/**
	 * Width of the emoji picker
	 * @group Props
	 */
	@Input()
	@HostBinding('style.--picker-width')
	width = 400;

	/**
	 * Determines the display size of the emojis
	 *
	 * This will be used to calculate the emoji size in pixels
	 *
	 * @group Props
	 */
	emojiSize = input<EmojiSizeOption>('default');

	/**
	 * Determines the mode of emoji suggestions in the picker
	 * @group Props
	 */
	suggestionMode = input<EmojiSuggestionMode>('recent');

	/**
	 * Location of the category bar
	 * @group Props
	 */
	categoryBarPosition = input<CategoryBarPosition>('top');

	/**
	 * Decides if the scrollbar is visible
	 *
	 * This property is also essential for accurately calculating the viewport width,
	 * which in turn influences the number of emojis displayed per row and their size.
	 *
	 * @group Props
	 */
	scrollbarVisible = input<boolean>(false);

	/**
	 * Categories to be included in the emoji picker
	 * Order will be respected, excepts for suggestion category
	 * @group Props
	 */
	emojiCategories = input<EmojiCategory[]>([...emojiCategories]);

	/**
	 * The maximum amount of suggestion emojis that will be shown in the emoji picker
	 * @group Props
	 */
	suggestionLimit = input<number>(50);

	/**
	 * Determines if suggestions will automatically be updated in storage
	 * @group Props
	 */
	autoUpdateSuggestions = input<boolean>(true);

	/**
	 * Defines the approach for handling skintone variations within the emoji picker.
	 * @group Props
	 */
	skintoneSetting = input<SkintoneSetting>('both');

	/**
	 * Callback to execute when button is clicked.
	 * This event is intended to be used with the <p-button> component. Using a regular <button> element, use (click).
	 * @param {Emoji} emoji - selected emoji.
	 * @group Props
	 */
	onEmojiSelected = output<Emoji>();

	@HostBinding('style.--ch-emoji-size') emojiSizeInPx?: number;
	@HostBinding('style.--ch-emoji-btn-size-multiplier')
	itemSizeMultiplier?: number;

	@HostBinding('style.--ch-padding-inline') padding?: number;

	emojiCategoriesStream$ = toObservable(this.emojiCategories)
		.pipe(takeUntilDestroyed())
		.subscribe((categories) => {
			if (!categories.includes(this.selectedCategory())) {
				this.selectedCategory.set(categories[0]);
				this.emojiViewportComponent()?.navigateToCategory(
					categories[0]
				);
			}
		});

	skintoneSettingStream$ = toObservable(this.skintoneSetting)
		.pipe(takeUntilDestroyed())
		.subscribe((setting) =>
			this.emojiDataService.setSkintoneSetting(setting)
		);

	selectedCategory = signal<EmojiCategory>(this.emojiCategories()[0]);

	emojiTouchHoldEventActive: boolean = false;
	private skintoneDialogRef?: OverlayRef;

	isIndividualSkintoneEnabled = computed(() =>
		this.isIndividualSkintoneSettingEnabled(this.skintoneSetting())
	);
	isGlobalSkintoneEnabled = computed(() =>
		this.isGlobalSkintoneSettingEnabled(this.skintoneSetting())
	);

	searchValue = model<string>('');

	defaultEmojis = computed(() => {
		const categories = this.emojiCategories();
		return EmojiDataHelper.filterAndSortEmojis(
			[...emojis],
			categories
		);
	});

	suggestionEmojis = computed(() => {
		const suggestionMode = this.suggestionMode();
		const suggestionLimit = this.suggestionLimit();
		const categories = this.emojiCategories();
		const recentEmojis = this.emojiDataService.recentEmojis();
		const frequentEmojis = this.emojiDataService.frequentEmojis();

		if (!categories.includes('suggestions')) return null;

		return suggestionMode === 'recent'
			? {
					suggestionMode,
					emojis: recentEmojis.slice(0, suggestionLimit),
			  }
			: {
					suggestionMode: suggestionMode,
					emojis: frequentEmojis.slice(0, suggestionLimit),
			  };
	});

	filteredEmojis$: Observable<FilteredEmojis> = toObservable(
		this.searchValue
	)
		.pipe(
			debounce((searchValue) => {
				if (searchValue.trim() === '') {
					return of(0);
				}

				return timer(250);
			}),
			distinctUntilChanged(),
			switchMap((searchValue) => {
				if (searchValue === '') {
					return of({ filterActive: false, emojis: [] });
				}

				return from(
					this.emojiFilterService.filter(
						searchValue,
						this.translationService.getLanguage(),
						this.defaultEmojis().map((emoji) => emoji.id)
					)
				).pipe(
					map<string[], FilteredEmojis>((emojiIds) => ({
						filterActive: true,
						emojis: this.emojiDataService.fetchEmojisByIds(emojiIds),
					}))
				);
			})
		)
		.pipe(startWith({ filterActive: false, emojis: [] }))
		.pipe(shareReplay(1));

	filteredEmojis = toSignal(this.filteredEmojis$);

	emojis = computed(() => {
		const defaultEmojis = this.defaultEmojis();
		const suggestionEmojis = this.suggestionEmojis();
		const filteredEmojis = this.filteredEmojis();

		return {
			defaultEmojis,
			suggestionEmojis,
			filteredEmojis: filteredEmojis || {
				filterActive: false,
				emojis: [],
			},
		};
	});

	noDataEmoji = computed(() => {
		return (
			this.emojiDataService
				.emojiMap()
				?.get('a4922734-f424-469c-aee2-7e8f89a8e411')?.value ?? '🤷'
		);
	});

	globalSkintone = this.emojiDataService.globalSkintoneSetting;

	private pointerDownListener?: () => void;

	constructor() {
		effect(() => (this.padding = this.emojiPickerService.padding()));

		effect(() => {
			this.itemSizeMultiplier =
				this.emojiPickerService.emojiItemSizeMultiplier();
		});
	}

	ngOnInit(): void {
		this.loadCountryFlagEmojiPolyfill();

		this.emojiDataService.skintoneSetting.set(this.skintoneSetting());

		this.pointerDownListener = this.createPointerDownListener();
	}

	ngOnDestroy(): void {
		if (!!this.pointerDownListener) {
			this.pointerDownListener();
		}
	}

	private createPointerDownListener = () => {
		return this.renderer.listen(
			this.elementRef.nativeElement,
			'pointerdown',
			(evt: PointerEvent) => {
				if (
					!(evt.target as HTMLElement).closest(
						'.ch-color-picker-container'
					)
				) {
					this.swatchPickerComponent()?.close();
				}
			}
		);
	};

	protected handleScroll = () => {
		this.swatchPickerComponent()?.close();
	};

	//Load a polyfill for flag emojis. Windows doesn't support flag emojis
	private loadCountryFlagEmojiPolyfill() {
		const script = this.renderer.createElement('script');
		script.type = 'module';
		script.defer = true;
		script.text = `
      import { polyfillCountryFlagEmojis } from 'https://cdn.skypack.dev/country-flag-emoji-polyfill';
      polyfillCountryFlagEmojis();
    `;
		this.renderer.appendChild(document.body, script);
	}

	protected handleSearchValueChanged = (evt: ValueChangeEvent) => {
		this.searchValue.set(evt.value);
	};

	protected handleEmojiSizeCalculated = (value: number) => {
		this.emojiSizeInPx = value;
	};

	protected handleCategoryTabClicked = (category: EmojiCategory) => {
		this.emojiViewportComponent()?.navigateToCategory(category);
	};

	protected handleEmojiClick = (evt: ClickEvent) => {
		if (!evt.data || this.emojiTouchHoldEventActive) {
			this.emojiTouchHoldEventActive = false;
			return;
		}
		this.processEmojiSelection(evt);
	};

	protected handleEmojiTouchHold = (evt: TouchHoldEvent) => {
		const emoji = this.emojiDataService.fetchEmojiById(evt.data);

		if (!emoji) return;

		this.emojiTouchHoldEventActive = this.isTouchHoldValid(
			evt,
			emoji
		);

		if (
			this.emojiTouchHoldEventActive &&
			this.isIndividualSkintoneSettingEnabled(this.skintoneSetting())
		) {
			this.openSkintoneDialog(evt.targetElement, emoji);
			console.log(evt);
		}
	};

	protected handleGlobalSkintoneChanged = (skintone: Skintone) => {
		this.emojiDataService.setGlobalEmojiSkintone(skintone);
	};

	private processEmojiSelection = (evt: ClickEvent) => {
		const emoji = this.emojiDataService.fetchEmojiById(evt.data);
		if (!emoji)
			throw new Error(`No emoji found with id: ${evt.data}`);

		if (evt.action === ClickActionType.RIGHTCLICK) {
			if (this.shouldOpenSkintoneDialog(emoji)) {
				this.openSkintoneDialog(evt.targetElement, emoji);
			}

			this.emojiTouchHoldEventActive = false;
			return;
		}
		this.selectEmoji(emoji);
	};

	private shouldOpenSkintoneDialog(emoji: Emoji): boolean {
		return (
			this.emojiDataService.hasEmojiSkintones(emoji) &&
			this.isIndividualSkintoneSettingEnabled(this.skintoneSetting())
		);
	}

	private isTouchHoldValid(
		evt: TouchHoldEvent,
		emoji: Emoji | null
	): boolean {
		return (
			!!emoji &&
			this.emojiDataService.hasEmojiSkintones(emoji) &&
			evt.event.pointerType === 'touch' &&
			this.isIndividualSkintoneSettingEnabled(this.skintoneSetting())
		);
	}

	private isIndividualSkintoneSettingEnabled = (
		skintoneSetting: SkintoneSetting
	) => {
		return ['both', 'individual'].includes(skintoneSetting);
	};
	private isGlobalSkintoneSettingEnabled = (
		skintoneSetting: SkintoneSetting
	) => {
		return ['both', 'global'].includes(skintoneSetting);
	};

	private setupOnBackdropClickHandler(
		targetElement: HTMLElement
	): void {
		let allowBackdropDismissal = false;

		const enableBackdropDismissal = () => {
			allowBackdropDismissal = true;
			this.setupBackdropClickHandler(() => allowBackdropDismissal);
		};

		const onInteractionEnd = () => {
			setTimeout(enableBackdropDismissal, 1);
			targetElement.removeEventListener(
				'pointerup',
				onInteractionEnd
			);
			targetElement.removeEventListener('mouseup', onInteractionEnd);
		};

		targetElement.addEventListener('pointerup', onInteractionEnd);
		targetElement.addEventListener('mouseup', onInteractionEnd, {
			once: true,
		});
	}

	private setupBackdropClickHandler(
		isDismissalAllowed: () => boolean
	): void {
		this.skintoneDialogRef
			?.backdropClick()
			.pipe(filter(isDismissalAllowed))
			.subscribe(() => this.disposeSkintoneDialog());
	}

	private disposeSkintoneDialog = () => {
		if (this.skintoneDialogRef) {
			this.skintoneDialogRef.dispose();
		}
	};

	private createSkintoneDialogPositionStrategy = (
		targetElement: HTMLElement
	) => {
		return this.overlay
			.position()
			.flexibleConnectedTo(targetElement)
			.withPush(true)
			.withPositions([
				{
					originX: 'center',
					originY: 'top',
					overlayX: 'center',
					overlayY: 'bottom',
				},
			]);
	};

	private createSkintoneDialog = (
		positionStrategy?: PositionStrategy
	) => {
		return this.overlay.create({
			positionStrategy,
			hasBackdrop: true,
			backdropClass: 'cdk-overlay-transparent-backdrop',
		});
	};

	private attachEmojiSkintonePickerToDialog = (
		dialogRef: OverlayRef,
		emoji: Emoji,
		skintoneSetting: SkintoneSetting
	) => {
		const emojiPortal = new ComponentPortal(
			EmojiSkintonePickerComponent
		);
		const componentRef = dialogRef.attach(emojiPortal);

		componentRef.setInput('emoji', emoji);
		componentRef.setInput('emojiSizeInPx', this.emojiSizeInPx);

		//No need to unsubscribe (output signals gets unsubscribed automatically)
		componentRef.instance.onSelectionChanged.subscribe(
			(evt: ClickEvent) => {
				this.handleIndividualEmojiSkintoneChanged(
					skintoneSetting,
					emoji,
					evt.data
				);

				dialogRef.dispose();
			}
		);
		return componentRef;
	};

	private handleIndividualEmojiSkintoneChanged = (
		skintoneSetting: SkintoneSetting,
		emoji: Emoji,
		emojiValue: string
	) => {
		if (skintoneSetting === 'individual')
			this.emojiDataService.updateEmojiSkintone(emoji.id, emojiValue);

		this.selectEmoji(
			Object.assign({ ...emoji }, { value: emojiValue })
		);
	};

	private openSkintoneDialog = (
		targetElement: HTMLElement,
		emoji: Emoji
	) => {
		this.disposeSkintoneDialog();

		const positionStrategy =
			this.createSkintoneDialogPositionStrategy(targetElement);

		this.skintoneDialogRef =
			this.createSkintoneDialog(positionStrategy);

		this.attachEmojiSkintonePickerToDialog(
			this.skintoneDialogRef,
			emoji,
			this.skintoneSetting()
		);

		this.setupOnBackdropClickHandler(targetElement);
	};

	/**
	 * Update suggestions (recent and frequently) in storage
	 * @param {string} emojiId - The id of the emoji to be updated.
	 * @group Method
	 */
	addEmojiToSuggestions = (emojiId: string) => {
		this.emojiDataService.addEmojiToRecents(emojiId);
		this.emojiDataService.increaseEmojiFrequency(emojiId);
	};

	/**
	 * Select an emoji manually and update the suggestion in storage if option was enabled
	 * @param {Emoji} emoji - Emoji object.
	 * @group Method
	 */
	selectEmoji = (emoji: Emoji) => {
		if (this.autoUpdateSuggestions()) {
			this.addEmojiToSuggestions(emoji.id);
		}
		this.onEmojiSelected.emit(emoji);
	};
}
