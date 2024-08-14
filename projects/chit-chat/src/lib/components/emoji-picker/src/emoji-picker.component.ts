import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	effect,
	ElementRef,
	EventEmitter,
	HostBinding,
	inject,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	Renderer2,
	SimpleChanges,
	viewChild,
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
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
	BehaviorSubject,
	combineLatest,
	debounce,
	from,
	map,
	Observable,
	of,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	take,
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
import { SuggestionEmojis } from './models/suggestion-emojis.model';
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
export class EmojiPickerComponent
	implements OnInit, OnChanges, OnDestroy
{
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
	height: number = 450;

	@Input()
	@HostBinding('style.--picker-width')
	width: number = 400;

	@Input() emojiSize: EmojiSizeKey = 'default';
	@Input() suggestionMode: EmojiSuggestionMode = 'recent';
	@Input() orientation: EmojiPickerOrientation = 'vertical';
	@Input() categoryBarPosition: CategoryBarPosition = 'top';
	@Input() scrollbarVisible: boolean = true;
	@Input() emojiCategories: EmojiCategory[] = [...emojiCategories];
	@Input() selectedCategory: EmojiCategory = this.emojiCategories[0];
	@Input() suggestionLimit: number = 50;
	@Input() autoUpdateSuggestions: boolean = true;
	@Input() skintoneSetting: SkintoneSetting = 'both';

	@Output() onEmojiSelected = new EventEmitter<Emoji>();

	emojiTouchHoldEventActive: boolean = false;
	private overlayRef?: OverlayRef;

	isIndividualSkintoneEnabled: boolean;
	isGlobalSkintoneEnabled: boolean;

	searchValue: string = '';
	private searchValueSubject = new Subject<ValueChangeEvent>();

	destroy$ = new Subject<void>();

	suggestionMode$ = new BehaviorSubject<EmojiSuggestionMode>(
		this.suggestionMode
	);
	suggestionLimit$ = new BehaviorSubject<number>(
		this.suggestionLimit
	);

	suggestionEmojis$: Observable<SuggestionEmojis | null> =
		combineLatest([
			this.suggestionMode$,
			this.suggestionLimit$,
			this.emojiDataService.emojiCategories$,
		]).pipe(
			switchMap(([mode, size, emojiCategories]) => {
				if (!emojiCategories.includes('suggestions')) return of(null);
				return mode === 'recent'
					? this.emojiDataService.recentEmojis$.pipe(
							map((emojis) => ({
								suggestionMode: mode,
								emojis: emojis.slice(0, size),
							}))
					  )
					: this.emojiDataService.frequentEmojis$.pipe(
							map((emojis) => ({
								suggestionMode: mode,
								emojis: emojis.slice(0, size),
							}))
					  );
			})
		);
	emojiCategories$: BehaviorSubject<EmojiCategory[]> =
		this.emojiDataService.emojiCategories$;

	filteredEmojis$: Observable<FilteredEmojis> =
		this.searchValueSubject
			.pipe(
				// Apply debounce here but only for events that are not 'clear' or empty
				debounce((evt) => {
					if (evt.action === 'clear' || evt.value.trim() === '') {
						return of(0);
					}

					return timer(250);
				}),
				switchMap((evt) => {
					if (evt.action === 'clear' || evt.value.trim() === '') {
						return of({ filterActive: false, emojis: [] });
					}

					return from(
						this.emojiFilterService.filter(
							evt.value,
							this.translationService.getLanguage(),
							this.emojiDataService.emojis$
								.getValue()
								.map((emoji) => emoji.id)
						)
					).pipe(
						map<string[], FilteredEmojis>((emojiIds) => ({
							filterActive: true,
							emojis:
								this.emojiDataService.fetchEmojisByIds(emojiIds),
						}))
					);
				})
			)
			.pipe(startWith({ filterActive: false, emojis: [] }))
			.pipe(shareReplay(1));

	emojis$: Observable<{
		emojis: Emoji[];
		suggestionEmojis: SuggestionEmojis | null;
		filteredEmojis: FilteredEmojis;
	}> = combineLatest([
		this.emojiDataService.emojis$,
		this.suggestionEmojis$,
		this.filteredEmojis$,
	]).pipe(
		map(([emojis, suggestionEmojis, filteredEmojis]) => ({
			emojis,
			suggestionEmojis,
			filteredEmojis,
		}))
	);

	noDataEmoji: string = '🤷';

	globalSkintone$ = this.emojiDataService.globalSkintoneSetting$;

	@HostBinding('style.--ch-emoji-size') emojiSizeInPx?: number;
	@HostBinding('style.--ch-emoji-btn-size-multiplier')
	itemSizeMultiplier?: number;

	@HostBinding('style.--ch-padding-inline') padding?: number;
	paddingState = toSignal(this.emojiPickerStateService.padding$);

	private pointerDownListener?: () => void;

	constructor() {
		this.isIndividualSkintoneEnabled =
			this.isSkintoneSettingEnabled();
		this.isGlobalSkintoneEnabled =
			this.isGlobalSkintoneSettingEnabled();

		effect(() => (this.padding = this.paddingState()));
	}

	handleSearchValueChanged = (evt: ValueChangeEvent) => {
		this.searchValueSubject.next(evt);
	};

	ngOnInit(): void {
		this.loadCountryFlagEmojiPolyfill();

		this.emojiPickerStateService.emojiSizeInPx$
			.pipe(
				switchMap((emojiSizeInPx) =>
					timer(0).pipe(map(() => emojiSizeInPx))
				),
				takeUntil(this.destroy$)
			)
			.subscribe((emojiSizeInPx) => {
				this.emojiSizeInPx = emojiSizeInPx;
			});

		this.emojiPickerStateService.emojiItemSizeMultiplier$
			.pipe(takeUntil(this.destroy$))
			.subscribe((emojiContainerSizeMultiplier) => {
				this.itemSizeMultiplier = emojiContainerSizeMultiplier;
			});

		this.emojiPickerStateService.padding$
			.pipe(takeUntil(this.destroy$))
			.subscribe((padding) => {
				this.padding = padding;
			});

		// //Whenever data in the emoji-map is changed, check for changes in child components
		this.emojiDataService.emojiMap$
			.pipe(takeUntil(this.destroy$))
			.subscribe((emojis) => {
				this.verticalEmojiPickerComponent()?.requestChangeDetection();
				this.noDataEmoji =
					this.emojiDataService.fetchEmojiById(
						'a4922734-f424-469c-aee2-7e8f89a8e411'
					)?.value ?? '🤷';
			});

		this.emojiDataService.setSkintoneSetting(this.skintoneSetting);

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

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['emojiCategories']) {
			this.emojiDataService.setEmojiCategories(
				changes['emojiCategories'].currentValue
			);

			const currentCategories =
				this.emojiDataService.emojiCategories$.getValue();
			if (currentCategories.length === 0) return;

			const isActiveCategoryInCategories =
				this.emojiCategories.includes(this.selectedCategory);
			this.selectedCategory = currentCategories[0];

			if (!isActiveCategoryInCategories) {
				this.verticalEmojiPickerComponent()?.navigateToCategory(
					currentCategories[0]
				);
			}
		}
		if (changes['suggestionMode']) {
			this.suggestionMode$.next(
				changes['suggestionMode'].currentValue
			);
		}
		if (changes['suggestionLimit']) {
			this.suggestionLimit$.next(
				changes['suggestionLimit'].currentValue
			);
		}

		if (changes['skintoneSetting']) {
			this.emojiDataService.setSkintoneSetting(
				changes['skintoneSetting'].currentValue
			);

			this.isIndividualSkintoneEnabled =
				this.isSkintoneSettingEnabled();
			this.isGlobalSkintoneEnabled =
				this.isGlobalSkintoneSettingEnabled();
		}
	}

	ngOnDestroy(): void {
		if (!!this.pointerDownListener) {
			this.pointerDownListener();
		}
		this.destroy$.next();
		this.destroy$.complete();
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
		this.selectedCategory = category;
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
				this.isSkintoneSettingEnabled()
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
			this.isSkintoneSettingEnabled()
		) {
			this.openSkintoneDialog(evt.targetElement, emoji);
		}
	};

	isSkintoneSettingEnabled = () => {
		return ['both', 'individual'].includes(this.skintoneSetting);
	};
	isGlobalSkintoneSettingEnabled = () => {
		return ['both', 'global'].includes(this.skintoneSetting);
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
		componentRef.instance.emoji = emoji;

		componentRef.instance.onSelectionChanged
			.pipe(take(1))
			.subscribe((evt: ClickEvent) => {
				if (this.skintoneSetting === 'individual')
					this.emojiDataService.updateEmojiSkintone(
						emoji.id,
						evt.data
					);
				this.selectEmoji(
					Object.assign({ ...emoji }, { value: evt.data })
				);
				this.overlayRef?.dispose();
			});

		this.overlayRef
			.backdropClick()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => this.overlayRef?.dispose());
	};

	handleGlobalSkintoneChanged = (skintone: Skintone) => {
		this.emojiDataService.updateGlobalSkintone(skintone);
	};

	selectEmoji = (emoji: Emoji) => {
		if (this.autoUpdateSuggestions) {
			this.addEmojiToSuggestions(emoji.id);
		}
		this.onEmojiSelected.emit(emoji);
	};
}
