import { DOCUMENT } from '@angular/common';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ScreenService } from 'chit-chat/src/lib/utils';
import { LibConfig } from '../lib-config/interfaces';
import { LibConfigService } from '../lib-config/services/lib-config.service';

export function initializeDocument(
	document: Document,
	screenService: ScreenService
): () => void {
	return () => {
		if (screenService.isMobile()) {
			document.body.classList.add('ch-mobile');
		}
	};
}

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

		provideAnimations(),
		{
			provide: APP_INITIALIZER,
			useFactory: initializeDocument,
			deps: [DOCUMENT, ScreenService],
			multi: true,
		},
	];
}
