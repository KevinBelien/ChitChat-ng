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
	Input,
	OnChanges,
	OnDestroy,
	Output,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { groupedEmojis, mappedEmojis } from '../../data';
import { EmojiSize, EmojiSizeKey } from '../../enums';
import {
	Emoji,
	EmojiCategory,
	EmojiPickerRow,
	GroupedEmoji,
} from '../../interfaces';
import { EmojiButtonComponent } from '../emoji-button/emoji-button.component';
import { emojiCategories } from './../../interfaces/emoji.interface';

import {
	ClickEvent,
	ClickTouchHoldDirective,
	RippleDirective,
	TouchHoldEvent,
} from 'chit-chat/src/lib/utils';

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
	@ViewChild(CdkVirtualScrollViewport, { static: false })
	viewport?: CdkVirtualScrollViewport;

	@Input()
	emojiSize: EmojiSizeKey = 'default';

	emojiSizeInPx: number = 0;

	@Input()
	height: number = 400;

	@Input()
	width: number = 250;

	@Input()
	scrollbarVisible: boolean = true;

	@HostBinding('style.--item-size-multiplier')
	itemSizeMultiplier: number = 1.5;

	itemSize: number = 0;

	@Input()
	emojiCategories: EmojiCategory[] = [...emojiCategories];

	mappedEmojis: Map<string, Emoji> = mappedEmojis;

	@Input()
	emojis: GroupedEmoji[] = groupedEmojis;

	@Input()
	currentCategory: EmojiCategory = this.emojiCategories[0];

	@Input()
	scrollWheelStep?: number;

	//REMOVE TWO WAY BINDING?
	@Output()
	currentCategoryChange = new EventEmitter<EmojiCategory>();

	scrollIndex: number = 0;

	manuallyNavigated: boolean = false;

	rows: EmojiPickerRow[] = [];

	touchHoldEventActive: boolean = false;

	destroy$ = new Subject<void>();

	@HostBinding('style.--sp-offset') spo: string = '0px';

	@HostBinding('style.--emoji-size')
	emoSize?: string;

	@Output()
	onClick = new EventEmitter<Emoji>();

	ngAfterViewInit() {
		this.viewport?.renderedRangeStream
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.viewport?.checkViewportSize();

				this.spo =
					-(this.viewport?.getOffsetToRenderedContentStart() || 0) +
					'px';
			});
		this.emojiSizeInPx = this.calculateEmojiSize();
		this.emoSize = `${this.emojiSizeInPx}px`;

		this.itemSize = this.toFixedAndFloor(
			this.emojiSizeInPx * this.itemSizeMultiplier,
			2
		);

		this.rows = this.generateEmojiRows();

		if (this.rows.length === 0) return;

		this.currentCategory =
			this.rows[0].type === 'emoji'
				? this.rows[0].value[0].category
				: (this.rows[0].value as EmojiCategory);
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (
			changes['emojiSize'] &&
			!changes['emojiSize'].isFirstChange()
		) {
			this.emojiSizeInPx = this.calculateEmojiSize();
			this.emoSize = `${this.emojiSizeInPx}px`;
			this.itemSize = this.emojiSizeInPx * this.itemSizeMultiplier;
			this.rows = this.generateEmojiRows();
		}

		if (changes['width'] && !changes['width'].isFirstChange()) {
			this.rows = this.generateEmojiRows();
		}

		if (changes['emojis'] && !changes['emojis'].isFirstChange()) {
			this.rows = this.generateEmojiRows();
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private calculateEmojiSize = () => {
		const viewportWidth = this.getViewportWidth();
		const idealEmojiSize = EmojiSize[this.emojiSize];
		const maxEmojisPerRow =
			this.calculateAmountEmojiInRows(idealEmojiSize);

		return this.toFixedAndFloor(
			viewportWidth / (maxEmojisPerRow * this.itemSizeMultiplier),
			2
		);
	};

	findDuplicates = (arr: any[], key: string): any[] => {
		const seenKeys = new Set<string>();
		const duplicates: any[] = [];

		for (const item of arr) {
			const keyValue = item[key];

			if (seenKeys.has(keyValue)) {
				duplicates.push(item);
			} else {
				seenKeys.add(keyValue);
			}
		}

		return duplicates;
	};

	handleScrolledIndexChanged = (index: number) => {
		if (this.rows.length === 0) return;
		this.scrollIndex = index;

		const previousRow = this.rows[index - 1];
		const currentRow = this.rows[index];

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

	setCurrentCategory = (category: EmojiCategory, emit: boolean) => {
		this.currentCategory = category;
		if (emit) this.currentCategoryChange.emit(this.currentCategory);
	};

	generateEmojiRows = (): EmojiPickerRow[] => {
		const maxEmojisPerRow = this.calculateAmountEmojiInRows(
			this.emojiSizeInPx
		);

		const rows: EmojiPickerRow[] = [];

		this.emojis.forEach((group) => {
			// Add the category title as a row
			rows.push({
				id: crypto.randomUUID(),
				type: 'category',
				value: group.category,
			});

			// Add the emojis in rows with a max of maxEmojisPerRow
			for (let i = 0; i < group.emojis.length; i += maxEmojisPerRow) {
				rows.push({
					id: crypto.randomUUID(),
					type: 'emoji',
					value: group.emojis.slice(i, i + maxEmojisPerRow),
				});
			}
		});
		return rows;
	};

	private calculateAmountEmojiInRows = (emojiSize: number) => {
		const viewportWidth = this.getViewportWidth();

		return Math.floor(
			viewportWidth / (emojiSize * this.itemSizeMultiplier)
		);
	};

	getViewportWidth = () => {
		return this.width - this.getScrollbarWidth();
	};

	getScrollbarWidth(): number {
		return this.scrollbarVisible ? this.getGlobalScrollbarWidth() : 0;
	}

	private getGlobalScrollbarWidth = (): number => {
		const root = document.querySelector(':root') as HTMLElement;
		const scrollbarWidth = getComputedStyle(root).getPropertyValue(
			'--ch-scrollbar-width'
		);
		return parseFloat(scrollbarWidth.replace('px', '').trim());
	};

	private toFixedAndFloor = (value: number, decimals: number) => {
		const multiplier = Math.pow(10, decimals);
		const flooredValue = Math.floor(value * multiplier) / multiplier;

		return Number(flooredValue.toFixed(decimals));
	};

	trackEmojiRow = (index: number, row: EmojiPickerRow) => {
		return row.id;
	};

	trackEmoji = (index: number, emoji: Emoji) => {
		return emoji.value;
	};

	handleTouchHold = (e: TouchHoldEvent) => {
		if (!e.data) return;
		const emoji = mappedEmojis.get(e.data);
		alert(emoji?.value);
		this.touchHoldEventActive =
			!!emoji && !!emoji.skinTones && emoji.skinTones.length > 0;

		// Call the method to show the popover with the target element and the emoji
	};
	handleClick = (e: ClickEvent) => {
		console.log(e);
		if (!e.data || this.touchHoldEventActive) {
			this.touchHoldEventActive = false;
			return;
		}

		const emoji = mappedEmojis.get(e.data);

		// Call the method to show the popover with the target element and the emoji
		console.log('gets to click', emoji);

		// console.log('pointer out', e);
	};

	navigateToCategory = (category: EmojiCategory) => {
		if (!this.emojiCategories.includes(category))
			throw new Error(
				`Couldn't navigate to category ${category} because it's not in the list of emojiCategories`
			);

		const index = this.calculateIndexOfCategory(category);
		if (index === -1)
			throw new Error(
				`Couldn't navigate to category ${category} because couldn't find index in viewport`
			);

		this.manuallyNavigated = true;

		this.viewport?.scrollToIndex(index === 0 ? index : index + 1);
	};

	calculateIndexOfCategory = (category: EmojiCategory) => {
		return this.rows.findIndex(
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
}
