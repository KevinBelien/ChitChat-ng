import {
	ChangeDetectorRef,
	inject,
	Pipe,
	PipeTransform,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationService } from '../services';

@Pipe({
	name: 'translate',
	standalone: true,
	pure: false,
})
export class TranslatePipe implements PipeTransform {
	private translationsService = inject(TranslationService);
	private cdr = inject(ChangeDetectorRef);

	constructor() {
		this.translationsService.currentLanguage$
			.pipe(takeUntilDestroyed())
			.subscribe(() => {
				this.cdr.markForCheck();
			});
	}
	transform(value: string): string {
		return (
			this.translationsService.getTranslationByKey(value) ?? value
		);
	}
}
