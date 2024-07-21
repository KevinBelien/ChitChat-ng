import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'button',
		pathMatch: 'full',
	},
	{
		path: 'button',
		loadComponent: () =>
			import('./pages/button/button.component').then(
				(c) => c.ButtonDemoComponent
			),
		pathMatch: 'full',
	},
	{
		path: '**',
		redirectTo: 'button',
	},
];
