import {
	CdkVirtualScrollViewport,
	ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostBinding,
	inject,
	Input,
	OnChanges,
	OnDestroy,
	Output,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import {
	BehaviorSubject,
	combineLatest,
	firstValueFrom,
	Observable,
	Subject,
	takeUntil,
} from 'rxjs';
import { emojis } from '../../data';
import { EmojiSize, EmojiSizeKey } from '../../enums';
import {
	Emoji,
	emojiCategories,
	EmojiCategory,
	EmojiPickerRow,
} from '../../models';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';
import { SuggestionEmojis } from './../../models/suggestion-emojis.model';

import {
	ClickEvent,
	ClickTouchHoldDirective,
	RippleDirective,
	TouchHoldEvent,
} from 'chit-chat/src/lib/utils';
import { EmojiPickerStateService } from '../../services/emoji-picker-state.service';
import { VerticalEmojiPickerService } from './services/vertical-emoji-picker.service';

@Component({
	selector: 'ch-vertical-emoji-picker',
	standalone: true,
	imports: [
		CommonModule,
		ScrollingModule,
		ClickTouchHoldDirective,
		EmojiButtonComponent,
		RippleDirective,
	],
	providers: [VerticalEmojiPickerService],
	templateUrl: './vertical-emoji-picker.component.html',
	styleUrls: ['./vertical-emoji-picker.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'collision-id': crypto.randomUUID(),
		class: 'ch-element',
	},
})
export class VerticalEmojiPickerComponent
	implements AfterViewInit, OnDestroy, OnChanges
{
	private dataService = inject(VerticalEmojiPickerService);
	private emojiPickerStateService = inject(EmojiPickerStateService);
	private cdr = inject(ChangeDetectorRef);

	@ViewChild(CdkVirtualScrollViewport, { static: false })
	viewport?: CdkVirtualScrollViewport;

	@Input() emojiSize: EmojiSizeKey = 'default';
	@Input() height: number = 400;
	@Input() width: number = 350;
	@Input() scrollbarVisible: boolean = true;
	@Input() suggestionEmojis: SuggestionEmojis | null = null;
	@Input() emojiCategories: EmojiCategory[] = [...emojiCategories];
	@Input() emojis: Emoji[] = [...emojis];
	@Input() currentCategory: EmojiCategory = this.emojiCategories[0];
	@Input() scrollWheelStep?: number;
	@Input() showSkintoneIndicator: boolean = true;

	@Output() currentCategoryChange = new EventEmitter<EmojiCategory>();
	@Output() onClick = new EventEmitter<ClickEvent>();
	@Output() onScroll = new EventEmitter<void>();
	@Output() onTouchHold = new EventEmitter<TouchHoldEvent>();

	scrollIndex: number = 0;
	manuallyNavigated: boolean = false;

	emojiRows$: Observable<EmojiPickerRow[]> =
		this.dataService.allEmojiRows$;

	private width$ = new BehaviorSubject<number>(this.width);
	private emojiSize$ = new BehaviorSubject<EmojiSizeKey>(
		this.emojiSize
	);
	itemSize$ = this.emojiPickerStateService.emojiItemSize$;

	destroy$ = new Subject<void>();

	@HostBinding('style.--sticky-offset')
	stickyHeaderOffset: number = 0;

	ngAfterViewInit(): void {
		this.viewport?.renderedRangeStream
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.viewport?.checkViewportSize();
				this.stickyHeaderOffset = -(
					this.viewport?.getOffsetToRenderedContentStart() || 0
				);
			});

		this.viewport
			?.elementScrolled()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => this.onScroll.emit());

		combineLatest([
			this.emojiPickerStateService.padding$,
			this.emojiPickerStateService.emojiItemSizeMultiplier$,
			this.width$,
			this.emojiSize$,
		])
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.updateEmojiSizeAndRows();
			});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (
			changes['emojiCategories'] &&
			changes['emojiCategories'].currentValue.length === 0
		) {
			this.scrollIndex = 0;
		}

		if (changes['emojiSize']) {
			this.emojiSize$.next(changes['emojiSize'].currentValue);
		}

		if (changes['width']) {
			this.width$.next(changes['width'].currentValue);
		}

		if (changes['emojis'] && !changes['emojis'].isFirstChange()) {
			this.updateEmojiRows();
		}

		if (
			changes['suggestionEmojis'] &&
			!changes['suggestionEmojis'].isFirstChange()
		) {
			this.updateSuggestionRows();
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private updateEmojiSizeAndRows(): void {
		const viewportWidth = this.getViewportWidth();
		const emojiSizeInPx = this.calculateEmojiSize(viewportWidth);

		this.emojiPickerStateService.setEmojiSize(emojiSizeInPx);

		this.updateSuggestionRows();
		this.updateEmojiRows();
	}

	private updateEmojiRows(): void {
		const viewportWidth = this.getViewportWidth();
		const emojiSizeInPx =
			this.emojiPickerStateService.emojiSizeInPx$.getValue();

		this.dataService.updateEmojiRows(
			this.emojis,
			emojiSizeInPx,
			viewportWidth,
			this.emojiPickerStateService.emojiItemSizeMultiplier$.getValue()
		);
	}

	private updateSuggestionRows(): void {
		const viewportWidth = this.getViewportWidth();
		const emojiSizeInPx =
			this.emojiPickerStateService.emojiSizeInPx$.getValue();

		this.dataService.updateSuggestionRows(
			this.suggestionEmojis,
			this.emojiCategories,
			emojiSizeInPx,
			viewportWidth,
			this.emojiPickerStateService.emojiItemSizeMultiplier$.getValue()
		);
	}

	private calculateEmojiSize(viewportWidth: number): number {
		return this.dataService.calculateEmojiSize(
			viewportWidth,
			EmojiSize[this.emojiSize],
			this.emojiPickerStateService.emojiItemSizeMultiplier$.getValue()
		);
	}

	private getViewportWidth = (): number => {
		return (
			this.width -
			0.1 -
			this.getScrollbarWidth() -
			this.emojiPickerStateService.padding$.getValue() * 2
		);
	};

	private getScrollbarWidth(): number {
		return this.scrollbarVisible ? this.getGlobalScrollbarWidth() : 0;
	}

	private getGlobalScrollbarWidth = (): number => {
		const root = document.querySelector(':root') as HTMLElement;
		const scrollbarWidth = getComputedStyle(root).getPropertyValue(
			'--ch-scrollbar-size'
		);
		return parseFloat(scrollbarWidth.replace('px', '').trim());
	};

	navigateToCategory = async (
		category: EmojiCategory
	): Promise<void> => {
		if (!this.emojiCategories.includes(category)) {
			throw new Error(
				`Couldn't navigate to category ${category} because it's not in the list of emojiCategories`
			);
		}

		const index = await this.calculateIndexOfCategory(category);
		if (index === -1) {
			throw new Error(
				`Couldn't navigate to category ${category} because couldn't find index in viewport`
			);
		}

		this.manuallyNavigated = true;

		this.viewport?.scrollToIndex(index === 0 ? index : index + 1);
	};

	private calculateIndexOfCategory = async (
		category: EmojiCategory
	): Promise<number> => {
		const rows = await firstValueFrom(this.emojiRows$);
		return rows.findIndex(
			(row) => row.type === 'category' && row.value === category
		);
	};

	setCurrentCategory = (
		category: EmojiCategory,
		emit: boolean
	): void => {
		this.currentCategory = category;
		if (emit) this.currentCategoryChange.emit(this.currentCategory);
	};

	protected handleScrolledIndexChanged = async (
		index: number
	): Promise<void> => {
		const rows = await firstValueFrom(this.emojiRows$);
		if (rows.length === 0) return;
		this.scrollIndex = index;

		const previousRow = rows[index - 1];
		const currentRow = rows[index];

		const currentCategory = this.determineCurrentCategory(
			currentRow,
			previousRow
		);
		this.setCurrentCategory(currentCategory, !this.manuallyNavigated);

		this.manuallyNavigated = false;
	};

	private determineCurrentCategory(
		currentRow: EmojiPickerRow,
		previousRow?: EmojiPickerRow
	): EmojiCategory {
		if (!!previousRow) {
			return previousRow.type === 'emoji'
				? previousRow.value[0].category
				: (previousRow.value as EmojiCategory);
		}

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
		event.preventDefault();
		const step =
			this.scrollWheelStep ??
			this.emojiPickerStateService.emojiSizeInPx$.getValue() * 4;
		const scrollAmount = Math.sign(event.deltaY) * step;
		this.viewport?.scrollToOffset(
			this.viewport?.measureScrollOffset() + scrollAmount
		);
	}

	protected trackEmojiRow = (
		index: number,
		row: EmojiPickerRow
	): string => {
		return row.id;
	};

	protected trackEmoji = (index: number, emoji: Emoji): string => {
		return emoji.value;
	};

	protected fetchEmojiById = (id: string) => {
		return this.dataService.fetchEmojiById(id)?.value;
	};

	requestChangeDetection = () => {
		this.cdr.markForCheck();
	};
}
