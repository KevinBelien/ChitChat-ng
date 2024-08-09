import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services';

@Pipe({
	name: 'translate',
	standalone: true,
})
export class TranslatePipe implements PipeTransform {
	private translationsService = inject(TranslationService);

	transform(value: string): string | null {
		return (
			this.translationsService.getTranslationByKey(value) ?? value
		);
	}
}
