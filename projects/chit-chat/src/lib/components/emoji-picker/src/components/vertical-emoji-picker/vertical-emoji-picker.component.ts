import {
	CdkVirtualScrollViewport,
	ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	HostBinding,
	inject,
	input,
	model,
	OnDestroy,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { emojis } from '../../data';
import { EmojiSize, EmojiSizeKey } from '../../enums';
import {
	Emoji,
	emojiCategories,
	EmojiCategory,
	EmojiPickerRow,
	FilteredEmojis,
} from '../../models';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';
import { SuggestionEmojis } from './../../models/suggestion-emojis.model';

import { toObservable } from '@angular/core/rxjs-interop';
import { TranslatePipe } from 'chit-chat/src/lib/localization';
import {
	ClickEvent,
	ClickTouchHoldDirective,
	RippleDirective,
	TouchHoldEvent,
} from 'chit-chat/src/lib/utils';
import { EmojiPickerService } from '../../services';

@Component({
	selector: 'ch-vertical-emoji-picker',
	standalone: true,
	imports: [
		CommonModule,
		ScrollingModule,
		ClickTouchHoldDirective,
		EmojiButtonComponent,
		RippleDirective,
		TranslatePipe,
	],
	templateUrl: './vertical-emoji-picker.component.html',
	styleUrls: ['./vertical-emoji-picker.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class VerticalEmojiPickerComponent
	implements AfterViewInit, OnDestroy
{
	private emojiPickerService = inject(EmojiPickerService);

	viewport = viewChild<CdkVirtualScrollViewport>(
		CdkVirtualScrollViewport
	);

	destroy$ = new Subject<void>();

	emojis = input<Emoji[]>([...emojis]);
	suggestionEmojis = input<SuggestionEmojis | null>(null);
	filteredEmojis = input<FilteredEmojis>({
		filterActive: true,
		emojis: [],
	});

	filteredEmojiStream$ = toObservable(this.filteredEmojis)
		.pipe(takeUntil(this.destroy$))
		.subscribe(() => {
			this.currentCategory.set(this.emojiCategories()[0]);
			this.viewport()?.scrollToIndex(0);
		});

	emojiCategories = input<EmojiCategory[]>([...emojiCategories]);
	emojiSize = input<EmojiSizeKey>('default');
	height = input<number>(400);
	width = input<number>(350);
	scrollbarVisible = input<boolean>(true);
	currentCategory = model<EmojiCategory>(this.emojiCategories()[0]);
	stickyHeaderCategory = signal<EmojiCategory>(
		this.emojiCategories()[0]
	);
	scrollWheelStep = input<number>();
	showSkintoneIndicator = input<boolean>(true);

	scrollIndex = signal<number>(0);

	onClick = output<ClickEvent>();
	onScroll = output<void>();
	onTouchHold = output<TouchHoldEvent>();
	onEmojiSizeCalculated = output<number>();

	scrollBarWidth = computed(() => {
		const scrollbarVisible = this.scrollbarVisible();
		return scrollbarVisible ? this.getGlobalScrollbarWidth() : 0;
	});

	viewportWidth = computed(() =>
		this.getViewportWidth(
			this.width(),
			this.emojiPickerService.padding(),
			this.scrollBarWidth()
		)
	);

	emojiSizeInPx = computed(() =>
		this.calculateEmojiSize(
			this.viewportWidth(),
			EmojiSize[this.emojiSize()],
			this.emojiPickerService.emojiItemSizeMultiplier()
		)
	);

	itemSize = computed(
		() =>
			this.emojiSizeInPx() *
			this.emojiPickerService.emojiItemSizeMultiplier()
	);

	suggestionEmojiRows = computed(() => {
		const suggestionEmojis = this.suggestionEmojis();
		if (
			!suggestionEmojis ||
			!this.emojiCategories().includes('suggestions')
		)
			return [];

		return this.emojiPickerService.generateEmojiRows({
			emojiSize: this.emojiSizeInPx(),
			viewportWidth: this.viewportWidth(),
			itemSizeMultiplier:
				this.emojiPickerService.emojiItemSizeMultiplier(),
			generateCategoryRows: true,
			type: 'suggestions',
			emojis: suggestionEmojis,
		});
	});

	filteredEmojiRows = computed(() => {
		const filteredEmojis = this.filteredEmojis();

		if (!filteredEmojis.filterActive) return [];

		return this.emojiPickerService.generateEmojiRows({
			emojiSize: this.emojiSizeInPx(),
			viewportWidth: this.viewportWidth(),
			itemSizeMultiplier:
				this.emojiPickerService.emojiItemSizeMultiplier(),
			generateCategoryRows: true,
			type: 'filter',
			emojis: filteredEmojis.emojis,
		});
	});

	defaultEmojiRows = computed(() => {
		return this.emojiPickerService.generateEmojiRows({
			emojiSize: this.emojiSizeInPx(),
			viewportWidth: this.viewportWidth(),
			itemSizeMultiplier:
				this.emojiPickerService.emojiItemSizeMultiplier(),
			generateCategoryRows: true,
			type: 'default',
			emojis: this.emojis(),
		});
	});

	emojiRows = computed((): EmojiPickerRow[] => {
		const filteredEmojis = this.filteredEmojis();

		return !filteredEmojis.filterActive
			? [...this.suggestionEmojiRows(), ...this.defaultEmojiRows()]
			: this.filteredEmojiRows();
	});

	emojiDataMap = this.emojiPickerService.emojiDataMap;

	emojiSIzeInPx$ = toObservable(this.emojiSizeInPx)
		.pipe(takeUntil(this.destroy$))
		.subscribe((emojiSIzeInPx) => {
			this.onEmojiSizeCalculated.emit(emojiSIzeInPx);
		});

	navigatedManually = signal<boolean>(false);

	@HostBinding('style.--sticky-offset')
	stickyHeaderOffset: number = 0;

	ngAfterViewInit(): void {
		this.viewport()
			?.renderedRangeStream.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.viewport()?.checkViewportSize();
				this.stickyHeaderOffset = -(
					this.viewport()?.getOffsetToRenderedContentStart() || 0
				);
			});

		this.viewport()
			?.elementScrolled()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				//SET NEW CURRENT CATEGORY FOR STICKY ELEMENT HEADER + MAKE SURE THE THE RIGHT CATEGORY IS SELECTED
				const offset = this.viewport()!.measureScrollOffset();
				const scrollIndex = Math.floor(offset / this.itemSize());

				const currentCategoryRow = this.navigatedManually()
					? this.emojiRows()[scrollIndex]
					: this.emojiRows()[scrollIndex - 1];

				this.navigatedManually.set(false);

				const stickyHeaderCategory = this.determineCurrentCategory(
					currentCategoryRow
				);
				this.stickyHeaderCategory.set(stickyHeaderCategory);

				this.onScroll.emit();
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private calculateEmojiSize(
		viewportWidth: number,
		emojiSize: EmojiSize,
		itemSizeMultiplier: number
	): number {
		return this.emojiPickerService.calculateEmojiSize(
			viewportWidth,
			emojiSize,
			itemSizeMultiplier
		);
	}

	private getViewportWidth = (
		width: number,
		padding: number,
		scrollbarWidth: number
	): number => {
		return width - 0.1 - scrollbarWidth - padding * 2;
	};

	private getGlobalScrollbarWidth = (): number => {
		const root = document.querySelector(':root') as HTMLElement;
		const scrollbarWidth = getComputedStyle(root).getPropertyValue(
			'--ch-scrollbar-size'
		);
		return parseFloat(scrollbarWidth.replace('px', '').trim());
	};

	navigateToCategory = (category: EmojiCategory): void => {
		const emojiCategories = this.emojiCategories();
		if (!emojiCategories.includes(category)) {
			throw new Error(
				`Couldn't navigate to category ${category} because it's not in the list of emojiCategories`
			);
		}

		const index = this.calculateIndexOfCategory(category);
		if (index === -1) {
			throw new Error(
				`Couldn't navigate to category ${category} because couldn't find index in viewport`
			);
		}

		this.scrollIndex.set(index);

		// Select the element to observe
		const targetNode = document.querySelector(
			'.ch-static-category.ch-sticky.ch-row'
		) as HTMLElement;

		if (targetNode) {
			const navigateIfReady = () => {
				const displayStyle = targetNode.style.display;
				if (displayStyle === 'block') {
					this.navigatedManually.set(true);
					this.viewport()?.scrollToIndex(
						index === 0 ? index : index + 1
					);
					return true;
				}
				return false;
			};

			// Check if it's already block
			if (!navigateIfReady()) {
				// If not, observe for changes
				const observer = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (
							mutation.type === 'attributes' &&
							mutation.attributeName === 'style'
						) {
							if (navigateIfReady()) {
								observer.disconnect(); // Stop observing once done
							}
						}
					});
				});

				observer.observe(targetNode, {
					attributes: true,
					attributeFilter: ['style'], // Only observe changes to the 'style' attribute
				});

				// Optionally, add a fallback in case the observer doesn't detect the change
				setTimeout(() => observer.disconnect(), 5000);
			}
		}
	};

	private calculateIndexOfCategory = (
		category: EmojiCategory
	): number => {
		const rows = this.emojiRows();
		return rows.findIndex(
			(row) => row.type === 'category' && row.value === category
		);
	};

	protected handleScrolledIndexChanged = (index: number): void => {
		const rows = this.emojiRows();
		if (rows.length === 0) return;

		this.scrollIndex.set(index);

		const currentRow = rows[index];
		const currentCategory = this.determineCurrentCategory(currentRow);
		this.currentCategory.set(currentCategory);
	};

	private determineCurrentCategory(
		currentRow: EmojiPickerRow
	): EmojiCategory {
		return currentRow.type === 'emoji'
			? currentRow.value[0].category
			: (currentRow.value as EmojiCategory);
	}

	protected handleTouchHold = (evt: TouchHoldEvent): void => {
		this.onTouchHold.emit(evt);
	};

	protected handleClick = (evt: ClickEvent): void => {
		this.onClick.emit(evt);
	};

	protected handleWheelScroll(event: WheelEvent): void {
		const viewport = this.viewport();
		if (!viewport) return;

		event.preventDefault();

		const step = this.scrollWheelStep() ?? this.emojiSizeInPx() * 4;

		const scrollAmount = Math.sign(event.deltaY) * step;

		viewport?.scrollToOffset(
			viewport?.measureScrollOffset() + scrollAmount
		);
	}

	protected trackEmojiRow = (
		index: number,
		row: EmojiPickerRow
	): string => {
		return row.id;
	};
}
