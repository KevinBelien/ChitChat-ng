import {
	ChangeDetectorRef,
	inject,
	OnDestroy,
	Pipe,
	PipeTransform,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TranslationService } from '../services';

@Pipe({
	name: 'translate',
	standalone: true,
	pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
	private translationsService = inject(TranslationService);
	private cdr = inject(ChangeDetectorRef);

	destroy$ = new Subject<void>();
	constructor() {
		this.translationsService.currentLanguage$
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.cdr.markForCheck();
			});
	}
	transform(value: string): string {
		return (
			this.translationsService.getTranslationByKey(value) ?? value
		);
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
