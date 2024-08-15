import { Overlay, OverlayRef } from '@angular/cdk/overlay';
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

import { toObservable, toSignal } from '@angular/core/rxjs-interop';

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
	from,
	map,
	Observable,
	of,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	timer,
} from 'rxjs';
import { EmojiTabsComponent } from './components/emoji-tabs/emoji-tabs.component';
import { EmojiSkintonePickerComponent } from './components/emojiskintone-picker/emoji-skintone-picker.component';
import { HorizontalEmojiPickerComponent } from './components/horizontal-emoji-picker/horizontal-emoji-picker.component';
import { SkintonePickerComponent } from './components/skintone-picker/skintone-picker.component';
import { VerticalEmojiPickerComponent } from './components/vertical-emoji-picker/vertical-emoji-picker.component';
import { EmojiSizeKey } from './enums/emoji-size.enum';
import {
	Emoji,
	emojiCategories,
	EmojiCategory,
	EmojiPickerOrientation,
	Skintone,
	SkintoneSetting,
} from './models';
import { CategoryBarPosition } from './models/category-bar-position.model';
import { EmojiSuggestionMode } from './models/emoji-suggestion-mode.model';
import { FilteredEmojis } from './models/filtered-emojis.model';
import { EmojiDataService } from './services';
import { EmojiFilterService } from './services/emoji-filter.service';
import { EmojiPickerStateService } from './services/emoji-picker-state.service';

@Component({
	selector: 'ch-emoji-picker',
	standalone: true,
	imports: [
		CommonModule,
		VerticalEmojiPickerComponent,
		HorizontalEmojiPickerComponent,
		EmojiTabsComponent,
		SkintonePickerComponent,
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
	private emojiPickerStateService = inject(EmojiPickerStateService);
	private translationService = inject(TranslationService);

	verticalEmojiPickerComponent =
		viewChild<VerticalEmojiPickerComponent>(
			VerticalEmojiPickerComponent
		);

	skintonePickerComponent = viewChild<SkintonePickerComponent>(
		SkintonePickerComponent
	);

	@Input()
	@HostBinding('style.--picker-height')
	height = 450;

	@Input()
	@HostBinding('style.--picker-width')
	width = 400;

	emojiSize = input<EmojiSizeKey>('default');
	suggestionMode = input<EmojiSuggestionMode>('recent');
	orientation = input<EmojiPickerOrientation>('vertical');
	categoryBarPosition = input<CategoryBarPosition>('top');
	scrollbarVisible = input<boolean>(true);
	emojiCategories = input<EmojiCategory[]>([...emojiCategories]);
	suggestionLimit = input<number>(50);
	autoUpdateSuggestions = input<boolean>(true);
	skintoneSetting = input<SkintoneSetting>('both');

	emojiCategoriesStream$ = toObservable(
		this.emojiCategories
	).subscribe((categories) => {
		this.selectedCategory.set(categories[0]);
		this.verticalEmojiPickerComponent()?.navigateToCategory(
			categories[0]
		);
	});

	skintoneSettingStream$ = toObservable(
		this.skintoneSetting
	).subscribe((setting) =>
		this.emojiDataService.setSkintoneSetting(setting)
	);

	selectedCategory = signal<EmojiCategory>(this.emojiCategories()[0]);

	onEmojiSelected = output<Emoji>();

	emojiTouchHoldEventActive: boolean = false;
	private overlayRef?: OverlayRef;

	isIndividualSkintoneEnabled = computed(() => {
		return this.isIndividualSkintoneSettingEnabled(
			this.skintoneSetting()
		);
	});
	isGlobalSkintoneEnabled = computed(() => {
		return this.isGlobalSkintoneSettingEnabled(
			this.skintoneSetting()
		);
	});

	searchValue = model<string>('');

	defaultEmojis = computed(() => {
		const categories = this.emojiCategories();
		return this.emojiDataService.filterAndSortEmojis(categories);
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

	@HostBinding('style.--ch-emoji-size') emojiSizeInPx?: number;
	@HostBinding('style.--ch-emoji-btn-size-multiplier')
	itemSizeMultiplier?: number;

	@HostBinding('style.--ch-padding-inline') padding?: number;

	paddingState = this.emojiPickerStateService.padding;

	private pointerDownListener?: () => void;

	private destroy$ = new Subject<void>();

	constructor() {
		effect(() => (this.padding = this.paddingState()));

		effect(() => {
			this.itemSizeMultiplier =
				this.emojiPickerStateService.emojiItemSizeMultiplier();
		});
	}

	handleSearchValueChanged = (evt: ValueChangeEvent) => {
		this.searchValue.set(evt.value);
	};

	handleEmojiSizeCalculated = (value: number) => {
		console.log('gets here', value);
		this.emojiSizeInPx = value;
	};

	ngOnInit(): void {
		this.loadCountryFlagEmojiPolyfill();

		this.emojiDataService.skintoneSetting.set(this.skintoneSetting());

		this.pointerDownListener = this.renderer.listen(
			this.elementRef.nativeElement,
			'pointerdown',
			(evt: PointerEvent) => {
				if (
					!(evt.target as HTMLElement).closest(
						'.ch-color-picker-container'
					)
				) {
					this.skintonePickerComponent()?.close();
				}
			}
		);
	}

	ngOnDestroy(): void {
		if (!!this.pointerDownListener) {
			this.pointerDownListener();
		}
	}

	handleScroll = () => {
		this.skintonePickerComponent()?.close();
	};

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

	handleCategoryTabClicked = (category: EmojiCategory) => {
		this.verticalEmojiPickerComponent()?.navigateToCategory(category);
	};

	addEmojiToSuggestions = (emojiId: string) => {
		this.emojiDataService.addEmojiToRecents(emojiId);
		this.emojiDataService.increaseEmojiFrequency(emojiId);
	};

	handleEmojiClick = (evt: ClickEvent) => {
		if (!evt.data || this.emojiTouchHoldEventActive) {
			this.emojiTouchHoldEventActive = false;
			return;
		}
		const emoji = this.emojiDataService.fetchEmojiById(evt.data);
		if (
			evt.action &&
			evt.action === ClickActionType.RIGHTCLICK &&
			!!emoji
		) {
			if (
				this.emojiDataService.hasEmojiSkintones(emoji) &&
				this.isIndividualSkintoneSettingEnabled(
					this.skintoneSetting()
				)
			) {
				this.openSkintoneDialog(evt.targetElement, emoji);
			}
			this.emojiTouchHoldEventActive = false;
			return;
		}
		if (!emoji)
			throw new Error(`No emoji found with id: ${evt.data}`);
		this.selectEmoji(emoji);
	};

	handleEmojiTouchHold = (evt: TouchHoldEvent) => {
		const emoji = this.emojiDataService.fetchEmojiById(evt.data);
		this.emojiTouchHoldEventActive =
			!!emoji &&
			this.emojiDataService.hasEmojiSkintones(emoji) &&
			evt.event.pointerType === 'touch';
		if (
			this.emojiTouchHoldEventActive &&
			!!emoji &&
			this.isIndividualSkintoneSettingEnabled(this.skintoneSetting())
		) {
			this.openSkintoneDialog(evt.targetElement, emoji);
		}
	};

	isIndividualSkintoneSettingEnabled = (
		skintoneSetting: SkintoneSetting
	) => {
		return ['both', 'individual'].includes(skintoneSetting);
	};
	isGlobalSkintoneSettingEnabled = (
		skintoneSetting: SkintoneSetting
	) => {
		return ['both', 'global'].includes(skintoneSetting);
	};

	openSkintoneDialog = (targetElement: HTMLElement, emoji: Emoji) => {
		if (this.overlayRef) {
			this.overlayRef.dispose();
		}
		const positionStrategy = this.overlay
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
		this.overlayRef = this.overlay.create({
			positionStrategy,
			hasBackdrop: true,
			backdropClass: 'cdk-overlay-transparent-backdrop',
		});
		const emojiPortal = new ComponentPortal(
			EmojiSkintonePickerComponent
		);
		const componentRef = this.overlayRef.attach(emojiPortal);
		componentRef.instance.emoji.set(emoji);
		componentRef.instance.emojiSizeInPx = this.emojiSizeInPx;

		componentRef.instance.onSelectionChanged.subscribe(
			(evt: ClickEvent) => {
				if (this.skintoneSetting() === 'individual')
					this.emojiDataService.updateEmojiSkintone(
						emoji.id,
						evt.data
					);
				this.selectEmoji(
					Object.assign({ ...emoji }, { value: evt.data })
				);

				this.overlayRef?.dispose();
			}
		);

		this.overlayRef
			.backdropClick()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => this.overlayRef?.dispose());
	};

	handleGlobalSkintoneChanged = (skintone: Skintone) => {
		this.emojiDataService.globalSkintoneSetting.set(skintone);
	};

	selectEmoji = (emoji: Emoji) => {
		if (this.autoUpdateSuggestions()) {
			this.addEmojiToSuggestions(emoji.id);
		}
		this.onEmojiSelected.emit(emoji);
	};
}
