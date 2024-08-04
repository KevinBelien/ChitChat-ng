import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
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
	ViewChild,
} from '@angular/core';
import {
	ClickActionType,
	ClickEvent,
	TouchHoldEvent,
} from 'chit-chat/src/lib/utils';
import {
	BehaviorSubject,
	combineLatest,
	map,
	Observable,
	of,
	Subject,
	switchMap,
	takeUntil,
	timer,
} from 'rxjs';
import { EmojiTabsComponent } from './components/emoji-tabs/emoji-tabs.component';
import { HorizontalEmojiPickerComponent } from './components/horizontal-emoji-picker/horizontal-emoji-picker.component';
import { SkintonePickerComponent } from './components/skintone-picker/skintone-picker.component';
import { VerticalEmojiPickerComponent } from './components/vertical-emoji-picker/vertical-emoji-picker.component';
import { EmojiPickerOrientation } from './enums';
import { EmojiSizeKey } from './enums/emoji-size.enum';
import { Emoji, emojiCategories, EmojiCategory } from './models';
import { CategoryBarPosition } from './models/category-bar-position.model';
import { EmojiSuggestionMode } from './models/emoji-suggestion-mode.model';
import { SuggestionEmojis } from './models/suggestion-emojis.model';
import { EmojiDataService } from './services';
import { EmojiPickerStateService } from './services/emoji-picker-state.service';

@Component({
	selector: 'ch-emoji-picker',
	standalone: true,
	imports: [
		CommonModule,
		VerticalEmojiPickerComponent,
		HorizontalEmojiPickerComponent,
		EmojiTabsComponent,
	],
	providers: [EmojiDataService],
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
	private renderer = inject(Renderer2);
	private overlay = inject(Overlay);
	private emojiPickerStateService = inject(EmojiPickerStateService);

	@ViewChild(VerticalEmojiPickerComponent, { static: false })
	verticalEmojiPickerComponent?: VerticalEmojiPickerComponent;

	@Input() emojiSize: EmojiSizeKey = 'default';
	@Input() suggestionMode: EmojiSuggestionMode = 'recent';
	@Input() height: number = 450;
	@Input() width: number = 400;
	@Input() orientation: EmojiPickerOrientation =
		EmojiPickerOrientation.VERTICAL;
	@Input() categoryBarPosition: CategoryBarPosition = 'top';
	@Input() scrollbarVisible: boolean = true;
	@Input() emojiCategories: EmojiCategory[] = [...emojiCategories];
	@Input() selectedCategory: EmojiCategory = this.emojiCategories[0];
	@Input() suggestionSize: number = 50;
	@Input() autoUpdateSuggestions: boolean = true;

	@Output() onEmojiSelected = new EventEmitter<Emoji>();

	emojiTouchHoldEventActive: boolean = false;
	private overlayRef?: OverlayRef;

	readonly Orientations = EmojiPickerOrientation;

	suggestionMode$ = new BehaviorSubject<EmojiSuggestionMode>(
		this.suggestionMode
	);
	suggestionSize$ = new BehaviorSubject<number>(this.suggestionSize);

	suggestionEmojis$: Observable<SuggestionEmojis | null> =
		combineLatest([
			this.suggestionMode$,
			this.suggestionSize$,
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

	emojis$: BehaviorSubject<Emoji[]> = this.emojiDataService.emojis$;

	allEmojis$ = combineLatest([
		this.emojis$,
		this.suggestionEmojis$,
	]).pipe(
		map(([emojis, suggestionEmojis]) => ({
			emojis,
			suggestionEmojis,
		}))
	);

	emojiCategories$ = this.emojiDataService.emojiCategories$;

	destroy$ = new Subject<void>();

	@HostBinding('style.--picker-height')
	pickerHeight: string = `${this.height}px`;
	@HostBinding('style.--picker-width')
	pickerWidth: string = `${this.width}px`;
	@HostBinding('style.--emoji-size') emojiSizeInPx?: string;
	@HostBinding('style.--item-size-multiplier')
	itemSizeMultiplier?: number;
	@HostBinding('style.--padding-inline') padding?: number;

	constructor() {
		this.emojiPickerStateService.emojiSizeInPx$
			.pipe(
				switchMap((emojiSizeInPx) =>
					timer(0).pipe(map(() => emojiSizeInPx))
				)
			)
			.subscribe((emojiSizeInPx) => {
				this.emojiSizeInPx = `${emojiSizeInPx}px`;
			});
		this.emojiPickerStateService.emojiItemSizeMultiplier$.subscribe(
			(emojiContainerSizeMultiplier) => {
				this.itemSizeMultiplier = emojiContainerSizeMultiplier;
			}
		);
		this.emojiPickerStateService.padding$.subscribe((padding) => {
			this.padding = padding;
		});
	}

	ngOnInit(): void {
		this.loadCountryFlagEmojiPolyfill();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['height']) {
			this.pickerHeight = `${this.height}px`;
		}
		if (changes['width']) {
			this.pickerWidth = `${this.width}px`;
		}
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

			if (
				!isActiveCategoryInCategories &&
				this.verticalEmojiPickerComponent
			) {
				this.verticalEmojiPickerComponent.navigateToCategory(
					currentCategories[0]
				);
			}
		}
		if (changes['suggestionMode']) {
			this.suggestionMode$.next(
				changes['suggestionMode'].currentValue
			);
		}
		if (changes['suggestionSize']) {
			this.suggestionSize$.next(
				changes['suggestionSize'].currentValue
			);
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

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
		if (this.verticalEmojiPickerComponent) {
			this.verticalEmojiPickerComponent.navigateToCategory(category);
		}
	};

	addEmojiToSuggestions = (emojiId: string) => {
		this.emojiDataService.addEmojiToRecents(emojiId);
		this.emojiDataService.incrementEmojiFrequency(emojiId);
	};

	handleEmojiClick = (e: ClickEvent) => {
		if (!e.data || this.emojiTouchHoldEventActive) {
			this.emojiTouchHoldEventActive = false;
			return;
		}
		const emoji = this.emojiDataService.getEmojiById(e.data);
		if (
			e.action &&
			e.action === ClickActionType.RIGHTCLICK &&
			!!emoji
		) {
			if (this.emojiDataService.hasEmojiSkintone(emoji)) {
				this.openSkintoneDialog(e.targetElement, emoji);
			}
			this.emojiTouchHoldEventActive = false;
			return;
		}
		if (!emoji) throw new Error(`No emoji found with id: ${e.data}`);
		this.selectEmoji(emoji);
	};

	handleEmojiTouchHold = (e: TouchHoldEvent) => {
		const emoji = this.emojiDataService.getEmojiById(e.data);
		this.emojiTouchHoldEventActive =
			!!emoji &&
			this.emojiDataService.hasEmojiSkintone(emoji) &&
			e.event.pointerType === 'touch';
		if (this.emojiTouchHoldEventActive && !!emoji) {
			this.openSkintoneDialog(e.targetElement, emoji);
		}
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
		const emojiPortal = new ComponentPortal(SkintonePickerComponent);
		const componentRef = this.overlayRef.attach(emojiPortal);
		componentRef.instance.emoji = emoji;
		this.overlayRef
			.backdropClick()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => this.overlayRef?.dispose());
	};

	selectEmoji = (emoji: Emoji) => {
		if (this.autoUpdateSuggestions) {
			this.addEmojiToSuggestions(emoji.id);
		}
		this.onEmojiSelected.emit(emoji);
	};
}
