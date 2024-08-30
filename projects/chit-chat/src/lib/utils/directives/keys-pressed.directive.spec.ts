import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { KeysPressedDirective } from './keys-pressed.directive';

@Component({
	imports: [KeysPressedDirective],
	standalone: true,
	template: `<div
		chKeysPressed
		[keyCombinations]="keyCombinations"
	></div>`,
})
class TestKeysPressedComponent {
	@Input() keyCombinations: string[][] = [];
}

describe('KeysPressedDirective', () => {
	let fixture: any;
	let directive: KeysPressedDirective;
	let component: TestKeysPressedComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TestKeysPressedComponent],
		});

		fixture = TestBed.createComponent(TestKeysPressedComponent);
		fixture.detectChanges();

		directive = fixture.debugElement
			.query(By.directive(KeysPressedDirective))
			.injector.get(KeysPressedDirective);
		component = fixture.componentInstance;
	});

	it('should create an instance of KeysPressedDirective', () => {
		expect(directive).toBeTruthy();
	});

	it('should emit keyCombinationPressed event when the correct key combination is pressed', () => {
		jest.spyOn(directive.keyCombinationPressed, 'emit');

		component.keyCombinations = [['control', 'a']];
		fixture.detectChanges();

		const keydownEventCtrl = new KeyboardEvent('keydown', {
			key: 'Control',
		});
		const keydownEventA = new KeyboardEvent('keydown', { key: 'A' });

		directive.handleKeyDownEvent(keydownEventCtrl);
		directive.handleKeyDownEvent(keydownEventA);

		expect(directive.keyCombinationPressed.emit).toHaveBeenCalledWith(
			{
				pressedKeys: ['control', 'a'],
				triggeredKeyCombination: ['control', 'a'],
			}
		);
	});

	it('should not emit keyCombinationPressed event when only one key of the combination is pressed', () => {
		jest.spyOn(directive.keyCombinationPressed, 'emit');

		component.keyCombinations = [['control', 'a']];
		fixture.detectChanges();

		const keydownEventCtrl = new KeyboardEvent('keydown', {
			key: 'Control',
		});

		directive.handleKeyDownEvent(keydownEventCtrl);

		expect(
			directive.keyCombinationPressed.emit
		).not.toHaveBeenCalled();
	});

	it('should not emit keyCombinationPressed event when one key is released after combination', () => {
		jest.spyOn(directive.keyCombinationPressed, 'emit');

		component.keyCombinations = [['control', 'a']];
		fixture.detectChanges();

		const keydownEventCtrl = new KeyboardEvent('keydown', {
			key: 'Control',
		});
		const keydownEventA = new KeyboardEvent('keydown', { key: 'A' });

		directive.handleKeyDownEvent(keydownEventCtrl);
		directive.handleKeyDownEvent(keydownEventA);

		const keyupEventCtrl = new KeyboardEvent('keyup', {
			key: 'Control',
		});

		directive.handleKeyUpEvent(keyupEventCtrl);

		expect(
			directive.keyCombinationPressed.emit
		).toHaveBeenCalledTimes(1);
	});
});
