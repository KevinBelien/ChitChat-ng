import {
	CdkVirtualScrollViewport,
	ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
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
import { firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
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
	styleUrl: './vertical-emoji-picker.component.scss',
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

	@ViewChild(CdkVirtualScrollViewport, { static: false })
	viewport?: CdkVirtualScrollViewport;

	@Input() emojiSize: EmojiSizeKey = 'default';
	@Input() height: number = 400;
	@Input() width: number = 250;
	@Input() scrollbarVisible: boolean = true;
	@Input() suggestionEmojis: SuggestionEmojis | null = null;
	@Input() emojiCategories: EmojiCategory[] = [...emojiCategories];
	@Input() emojis: Emoji[] = [...emojis];
	@Input() currentCategory: EmojiCategory = this.emojiCategories[0];
	@Input() scrollWheelStep?: number;

	@HostBinding('style.--item-size-multiplier')
	itemSizeMultiplier: number = 1.5;
	@HostBinding('style.--sp-offset') spo: string = '0px';
	@HostBinding('style.--emoji-size') emoSize?: string;

	@Output() currentCategoryChange = new EventEmitter<EmojiCategory>();
	@Output() onClick = new EventEmitter<Emoji>();

	scrollIndex: number = 0;
	manuallyNavigated: boolean = false;
	touchHoldEventActive: boolean = false;

	emojiSizeInPx: number = 0;
	itemSize: number = 0;

	emojiRows$: Observable<EmojiPickerRow[]> =
		this.dataService.finalRows$;

	destroy$ = new Subject<void>();

	ngAfterViewInit(): void {
		this.viewport?.renderedRangeStream
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.viewport?.checkViewportSize();
				this.spo =
					-(this.viewport?.getOffsetToRenderedContentStart() || 0) +
					'px';
			});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (
			changes['emojiCategories'].currentValue &&
			changes['emojiCategories'].currentValue.length === 0
		) {
			this.scrollIndex = 0;
		}

		if (changes['emojiSize'] || changes['width']) {
			this.updateEmojiSizeAndRows();
		}

		if (changes['emojis']) {
			this.dataService.updateEmojiRows(
				changes['emojis'].currentValue,
				this.emojiSizeInPx,
				this.getViewportWidth(),
				this.itemSizeMultiplier
			);
		}

		if (changes['suggestionEmojis']) {
			this.dataService.updateSuggestionRows(
				changes['suggestionEmojis'].currentValue,
				this.emojiCategories,
				this.emojiSizeInPx,
				this.getViewportWidth(),
				this.itemSizeMultiplier
			);
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private updateEmojiSizeAndRows(): void {
		const viewportWidth = this.getViewportWidth();
		this.emojiSizeInPx = this.dataService.calculateEmojiSize(
			viewportWidth,
			EmojiSize[this.emojiSize],
			this.itemSizeMultiplier
		);
		this.emoSize = `${this.emojiSizeInPx}px`;
		this.itemSize = this.emojiSizeInPx * this.itemSizeMultiplier;

		this.dataService.updateSuggestionRows(
			this.suggestionEmojis,
			this.emojiCategories,
			this.emojiSizeInPx,
			viewportWidth,
			this.itemSizeMultiplier
		);

		this.dataService.updateEmojiRows(
			this.emojis,
			this.emojiSizeInPx,
			viewportWidth,
			this.itemSizeMultiplier
		);
	}

	private getViewportWidth = (): number => {
		return this.width - this.getScrollbarWidth();
	};

	private getScrollbarWidth(): number {
		return this.scrollbarVisible ? this.getGlobalScrollbarWidth() : 0;
	}

	private getGlobalScrollbarWidth = (): number => {
		const root = document.querySelector(':root') as HTMLElement;
		const scrollbarWidth = getComputedStyle(root).getPropertyValue(
			'--ch-scrollbar-width'
		);
		return parseFloat(scrollbarWidth.replace('px', '').trim());
	};

	trackEmojiRow = (index: number, row: EmojiPickerRow): string => {
		return row.id;
	};

	trackEmoji = (index: number, emoji: Emoji): string => {
		return emoji.value;
	};

	handleTouchHold = (e: TouchHoldEvent): void => {
		if (!e.data) return;
		const emoji = this.dataService.getEmojiById(e.data);
		alert(emoji?.value);
		this.touchHoldEventActive =
			!!emoji && !!emoji.skinTones && emoji.skinTones.length > 0;
	};

	handleClick = (e: ClickEvent): void => {
		if (!e.data || this.touchHoldEventActive) {
			this.touchHoldEventActive = false;
			return;
		}

		const emoji = this.dataService.getEmojiById(e.data);
		this.onClick.emit(emoji);
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

	calculateIndexOfCategory = async (
		category: EmojiCategory
	): Promise<number> => {
		const rows = await firstValueFrom(this.emojiRows$);
		return rows.findIndex(
			(row) => row.type === 'category' && row.value === category
		);
	};

	onWheel(event: WheelEvent): void {
		event.preventDefault();
		const step = this.scrollWheelStep ?? this.itemSize * 4;
		const scrollAmount = Math.sign(event.deltaY) * step;
		this.viewport?.scrollToOffset(
			this.viewport?.measureScrollOffset() + scrollAmount
		);
	}

	setCurrentCategory = (
		category: EmojiCategory,
		emit: boolean
	): void => {
		this.currentCategory = category;
		if (emit) this.currentCategoryChange.emit(this.currentCategory);
	};

	handleScrolledIndexChanged = async (
		index: number
	): Promise<void> => {
		const rows = await firstValueFrom(this.emojiRows$);
		if (rows.length === 0) return;
		this.scrollIndex = index;

		const previousRow = rows[index - 1];
		const currentRow = rows[index];

		this.setCurrentCategory(
			previousRow
				? previousRow.type === 'emoji'
					? previousRow.value[0].category
					: (previousRow.value as EmojiCategory)
				: currentRow.type === 'emoji'
				? currentRow.value[0].category
				: (currentRow.value as EmojiCategory),
			!this.manuallyNavigated
		);

		this.manuallyNavigated = false;
	};
}
