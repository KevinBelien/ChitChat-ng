import { DOCUMENT } from '@angular/common';
import {
	APP_INITIALIZER,
	ModuleWithProviders,
	NgModule,
	Provider,
} from '@angular/core';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ScreenService } from '@chit-chat/ng-chat/src/lib/utils';
import { LibConfig } from '../lib-config/models';
import { LibConfigService } from '../lib-config/services/lib-config.service';

function initializeDocument(
	document: Document,
	screenService: ScreenService
): () => void {
	return () => {
		if (screenService.isMobile()) {
			document.body.classList.add('ch-mobile');
		}
	};
}

/**
 * Provides the configuration and necessary services for the ChitChat module.
 * This function is used in the module's `forRoot` method to configure the library at the application level.
 *
 * @param {LibConfig} config - The configuration object for the library, including Firebase options.
 * @returns {Provider[]} An array of providers required for the ChitChat module.
 */
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

/**
 * A module that provides all the necessary services and configuration for the ChitChat library.
 * Use the `forRoot` method to configure the module with a custom `LibConfig`.
 *
 * @module ChitChatModule
 */

@NgModule()
export class ChitChatModule {
	static forRoot(
		config: LibConfig
	): ModuleWithProviders<ChitChatModule> {
		return {
			ngModule: ChitChatModule,
			providers: [
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
			],
		};
	}
}
