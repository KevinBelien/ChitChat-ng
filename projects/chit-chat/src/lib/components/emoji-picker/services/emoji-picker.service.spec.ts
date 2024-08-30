import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmojiRowGenerator } from '../helpers';
import { Emoji, EmojiRowGenerationConfig } from '../models';
import { EmojiPickerService } from './emoji-picker.service';

@Component({
	selector: 'app-emoji-picker-mock',
	template: `<div></div>`,
})
class EmojiPickerMockComponent {
	constructor(public emojiPickerService: EmojiPickerService) {}

	setMultiplier(value: number) {
		this.emojiPickerService.setEmojiContainerSizeMultiplier(value);
	}

	setPadding(value: number) {
		this.emojiPickerService.setPadding(value);
	}

	generateRows(config: EmojiRowGenerationConfig) {
		return this.emojiPickerService.generateEmojiRows(config);
	}

	calculateEmojiSize(
		viewportSize: number,
		emojiSize: number,
		itemSizeMultiplier: number
	) {
		return this.emojiPickerService.calculateEmojiSize(
			viewportSize,
			emojiSize,
			itemSizeMultiplier
		);
	}

	calculateEmojisPerRow(
		emojiSize: number,
		viewportSize: number,
		itemSizeMultiplier: number
	) {
		return this.emojiPickerService.calculateEmojisPerRow(
			emojiSize,
			viewportSize,
			itemSizeMultiplier
		);
	}
}

describe('EmojiPickerService via EmojiPickerMockComponent', () => {
	let component: EmojiPickerMockComponent;
	let service: EmojiPickerService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [EmojiPickerMockComponent],
			providers: [EmojiPickerService],
		}).compileComponents();

		const fixture = TestBed.createComponent(EmojiPickerMockComponent);
		component = fixture.componentInstance;
		service = TestBed.inject(EmojiPickerService);
	});

	it('should create the mock component', () => {
		expect(component).toBeTruthy();
	});

	it('should set emoji item size multiplier', () => {
		const multiplierValue = 2;
		component.setMultiplier(multiplierValue);
		expect(service.emojiItemSizeMultiplier()).toEqual(
			multiplierValue
		);
	});

	it('should set padding value', () => {
		const paddingValue = 10;
		component.setPadding(paddingValue);
		expect(service.padding()).toEqual(paddingValue);
	});

	it('should calculate correct emoji size', () => {
		const viewportSize = 432;
		const emojiSize = 24;
		const itemSizeMultiplier = 1.5;

		const calculatedSize = component.calculateEmojiSize(
			viewportSize,
			emojiSize,
			itemSizeMultiplier
		);

		expect(calculatedSize).toBeCloseTo(24);
	});

	it('should calculate correct number of emojis per row', () => {
		const emojiSize = 24;
		const viewportSize = 400;
		const itemSizeMultiplier = 1.5;

		const emojisPerRow = component.calculateEmojisPerRow(
			emojiSize,
			viewportSize,
			itemSizeMultiplier
		);

		expect(emojisPerRow).toEqual(
			Math.floor(viewportSize / (emojiSize * itemSizeMultiplier))
		);
	});

	it('should generate emoji rows based on config', () => {
		const config: EmojiRowGenerationConfig = {
			emojiSize: 24,
			viewportWidth: 400,
			itemSizeMultiplier: 1.5,
			generateCategoryRows: true,
			type: 'filter',
			emojis: [
				{
					id: '1',
					name: 'Smiling Face',
					value: '😊',
					category: 'smileys-people',
					order: 1,
					keywords: ['smile', 'happy', 'joy'],
				} as Emoji,
			],
		};

		const generatorSpy = jest.spyOn(
			EmojiRowGenerator.prototype,
			'generateEmojiRowsPerCategory'
		);

		component.generateRows(config);

		expect(generatorSpy).toHaveBeenCalled();
	});
});
