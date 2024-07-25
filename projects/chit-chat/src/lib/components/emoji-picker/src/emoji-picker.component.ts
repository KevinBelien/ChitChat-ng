import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	HostBinding,
	Input,
	OnChanges,
	OnInit,
	Renderer2,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { EmojiTabsComponent } from './components/emoji-tabs/emoji-tabs.component';
import { HorizontalEmojiPickerComponent } from './components/horizontal-emoji-picker/horizontal-emoji-picker.component';
import { VerticalEmojiPickerComponent } from './components/vertical-emoji-picker/vertical-emoji-picker.component';
import { EmojiPickerOrientation } from './enums';
import { EmojiSizeKey } from './enums/emoji-size.enum';
import { Emoji, emojiCategories, EmojiCategory } from './interfaces';
import { EmojiDataService } from './services';

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
	implements OnInit, AfterViewInit, OnChanges
{
	@ViewChild(VerticalEmojiPickerComponent, { static: false })
	verticalEmojiPickerComponent?: VerticalEmojiPickerComponent;

	@Input()
	emojiSize: EmojiSizeKey = 'default';

	@Input()
	height: number = 450;

	@Input()
	width: number = 350;

	@Input()
	orientation: EmojiPickerOrientation =
		EmojiPickerOrientation.VERTICAL;

	@Input()
	scrollbarVisible: boolean = true;

	emojis$: Observable<Emoji[]> = new Observable<Emoji[]>();

	@Input()
	emojiCategories: EmojiCategory[] = [...emojiCategories].filter(
		(cat) => cat !== 'recent'
	);

	@Input()
	selectedCategory: EmojiCategory = this.emojiCategories[0];

	@HostBinding('style.--picker-height')
	pickerHeight: string = `${this.height}px`;

	@HostBinding('style.--picker-width')
	pickerWidth: string = `${this.width}px`;

	readonly Orientations = EmojiPickerOrientation;

	constructor(
		private renderer: Renderer2,
		private emojiDataService: EmojiDataService
	) {
		this.emojis$ = this.emojiDataService.dbInitialized.pipe(
			tap((initialized) => console.log('initialized', initialized)),
			filter((initialized) => initialized), // Proceed only if db is initialized
			switchMap(() => {
				console.log('gets to emoji data fetch');
				return this.emojiDataService.fetchEmojis(
					this.emojiCategories
				);
			})
		);
	}

	ngOnInit(): void {
		this.loadCountryFlagEmojiPolyfill();
		// console.log(
		// 	groupedEmojis.map((record) => {
		// 		return Object.assign(record, {
		// 			emojis: record.emojis.map((emoji) =>
		// 				Object.assign(
		// 					{ ...emoji },
		// 					{ name: emoji.name.toLowerCase() }
		// 				)
		// 			),
		// 		});
		// 	})
		// );
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['height']) {
			this.pickerHeight = `${this.height}px`;
		}
		if (changes['width']) {
			this.pickerWidth = `${this.width}px`;
		}

		if (
			changes['emojiCategories'] &&
			!changes['emojiCategories'].isFirstChange()
		) {
			this.emojiDataService.dbInitialized.pipe(
				filter((initialized) => initialized), // Proceed only if db is initialized
				switchMap(() =>
					this.emojiDataService.fetchEmojis(this.emojiCategories)
				)
			);

			const isActiveCategoryInCategories =
				this.emojiCategories.includes(this.selectedCategory);

			if (!isActiveCategoryInCategories) {
				if (this.verticalEmojiPickerComponent) {
					this.verticalEmojiPickerComponent.navigateToCategory(
						changes['emojiCategories'].currentValue[0]
					);
				}
			}
		}
	}

	ngAfterViewInit(): void {
		// this.emojis = this.filterAndSortEmojisByCategoryList(
		// 	this.emojiCategories
		// );
	}

	//add polyfill script to support flag emojis for windows users
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

	// filterGroupedEmojisByIncludedCategories = (
	// 	emojis: GroupedEmoji[],

	// 	includedCategories: EmojiCategory[]
	// ): GroupedEmoji[] => {
	// 	return emojis.filter((group) =>
	// 		includedCategories.includes(group.category)
	// 	);
	// };

	// filterAndSortEmojisByCategoryList = (
	// 	categories: EmojiCategory[]
	// ) => {
	// 	const filteredEmojis =
	// 		this.filterGroupedEmojisByIncludedCategories(
	// 			this.emojis,
	// 			categories
	// 		);
	// 	return this.sortGroupedEmojisByCategories(
	// 		filteredEmojis,
	// 		categories
	// 	);
	// };

	// sortGroupedEmojisByCategories = (
	// 	emojis: GroupedEmoji[],
	// 	categories: EmojiCategory[]
	// ): GroupedEmoji[] => {
	// 	return emojis.sort(
	// 		(a, b) =>
	// 			categories.indexOf(a.category) -
	// 			categories.indexOf(b.category)
	// 	);
	// };
}
