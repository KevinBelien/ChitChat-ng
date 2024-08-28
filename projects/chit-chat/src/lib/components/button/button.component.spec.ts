import { render, screen } from '@testing-library/angular';
import { ButtonComponent } from './button.component';

describe('Button', () => {
	test('should render label', async () => {
		await render(ButtonComponent, {
			componentInputs: { label: 'Test button' },
		});

		expect(screen.getByText('Test button')).toBeTruthy();
	});

	// test('should increment the counter on click', async () => {
	// 	await render(CounterComponent, {
	// 		componentProperties: { counter: 5 },
	// 	});

	// 	fireEvent.click(screen.getByText('+'));

	// 	expect(screen.getByText('Current Count: 6')).toBeInTheDocument();
	// });
});
