import { Component, Directive } from '@angular/core';
import {
	ComponentFixture,
	TestBed,
	waitForAsync,
} from '@angular/core/testing';
import { IconComponent } from '@chit-chat/ng-chat/lib/components/icon';
import { RippleDirective } from '@chit-chat/ng-chat/src/lib/utils';
import { ButtonComponent } from './button.component';
import { ButtonIconProps } from './models';

@Component({
	imports: [ButtonComponent],
	standalone: true,
	template: `<ch-button [disabled]="disabled" [icon]="icon">
	</ch-button>`,
})
class TestButtonComponent {
	disabled: boolean = false;
	icon?: Partial<ButtonIconProps>;
}

@Component({ standalone: true, selector: 'ch-icon', template: '' })
class IconStubComponent {}

@Directive({
	standalone: true,
	selector: 'ch-ripple',
})
class RippleStubDirective {}

// TestBed.configureTestingModule({
// 	imports: [
// 		ButtonComponent,
// 		RippleStubDirective,
// 		IconStubComponent,
// 		TestButtonComponent,
// 	],
// });

// describe('Button', () => {
// 	let fixture: ComponentFixture<TestButtonComponent>;

// 	beforeEach(() => {
// 		fixture = TestBed.createComponent(TestButtonComponent);
// 		fixture.autoDetectChanges();
// 	});

// 	// it('should render the button element', () => {
// 	// 	const buttonElement = fixture.debugElement.query(
// 	// 		By.css('ch-button')
// 	// 	);

// 	// 	console.log(buttonElement.children);
// 	// 	expect(buttonElement).not.toBeNull();
// 	// });

// 	it('should be disabled when disabled is true', () => {
// 		fixture.componentInstance.disabled = true;
// 		fixture.detectChanges();

// 		const buttonEl = fixture.debugElement.query(By.css('ch-button'));

// 		expect(buttonEl.nativeElement.disabled).toBeTruthy();
// 	});

// 	it('should display the icon when provided', () => {
// 		fixture.componentInstance.icon = {
// 			path: 'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
// 		};
// 		fixture.detectChanges();

// 		const iconEl = fixture.debugElement.query(By.css('ch-icon'));
// 		expect(iconEl).not.toBeNull();
// 	});
// });

describe('ButtonComponent', () => {
	let component: ButtonComponent;
	let fixture: ComponentFixture<ButtonComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			imports: [TestButtonComponent],
		})
			.overrideComponent(ButtonComponent, {
				remove: { imports: [IconComponent, RippleDirective] },
				add: { imports: [IconStubComponent, RippleStubDirective] },
			})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ButtonComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeDefined();
	});
});
