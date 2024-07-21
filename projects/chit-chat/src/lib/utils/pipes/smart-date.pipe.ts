import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'smartDate',
	standalone: true,
})
export class SmartDatePipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	transform(value: any): string | null {
		const currentDate = new Date();
		const inputDate = new Date(value);
		const yesterday = new Date(currentDate);
		yesterday.setDate(currentDate.getDate() - 1);

		const fiveDaysAgo = new Date(currentDate);
		fiveDaysAgo.setDate(currentDate.getDate() - 5);

		if (inputDate.toDateString() === currentDate.toDateString()) {
			return 'today';
		}

		if (inputDate.toDateString() === yesterday.toDateString()) {
			return 'yesterday';
		}

		if (inputDate >= fiveDaysAgo) {
			return this.datePipe.transform(value, 'EEEE');
		}

		return this.datePipe.transform(value, 'dd/MM/y');
	}
}
