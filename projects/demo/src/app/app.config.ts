import {
	ApplicationConfig,
	provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideChitChat } from 'chit-chat';
import { routes } from './app.routes';
import { environment } from './environments/environment';

const chitChatConfig = {
	firebaseConfig: environment.FIREBASE_CONFIG,
};

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		// importProvidersFrom(
		// 	ChitChatModule.forRoot({
		// 		firebaseConfig: environment.FIREBASE_CONFIG,
		// 	})
		// ),
		provideChitChat(chitChatConfig),

		provideFirebaseApp(() =>
			initializeApp(environment.FIREBASE_CONFIG)
		),
		provideAuth(() => getAuth()),
	],
};
