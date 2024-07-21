import { DOCUMENT } from '@angular/common';
import { inject, Provider } from '@angular/core';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from 'chit-chat/src/lib/auth';
import { ScreenService } from 'chit-chat/src/lib/utils';
import { LibConfig } from '../lib-config/interfaces';
import { LibConfigService } from '../lib-config/services/lib-config.service';

export function provideChitChat(config: LibConfig): Provider[] {
	return [
		{
			provide: LibConfigService,
			useValue: config,
		},
		{
			provide: FIREBASE_OPTIONS,
			useValue: config.firebaseConfig,
		},
		AuthService,
		ScreenService,
		provideAnimations(),
		{
			provide: 'DOCUMENT_INITIALIZER',
			useFactory: () => () => {
				const document = inject(DOCUMENT);
				const screenService: ScreenService = inject(ScreenService);

				if (screenService.isMobile()) {
					document.body.classList.add('ch-mobile');
				}
			},
			multi: true,
		},
	];
}
