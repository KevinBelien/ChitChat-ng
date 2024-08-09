import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from 'chit-chat/src/lib/auth';
import { ButtonComponent } from 'chit-chat/src/lib/components/button';
import {
	nlTranslations,
	TranslationService,
} from 'chit-chat/src/lib/localization';
import { ScreenService } from 'chit-chat/src/lib/utils';
import { NavigationItem, navigationItems } from './app-navigation';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet,
		RouterModule,
		CommonModule,
		MatSidenavModule,
		MatListModule,
		ButtonComponent,
		MatToolbarModule,
		MatSlideToggleModule,
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
	private renderer = inject(Renderer2);
	private authenticationService = inject(AuthService);
	private screenService = inject(ScreenService);
	private translationsService = inject(TranslationService);

	readonly navigationItems = [...navigationItems];

	selectedNavItem: NavigationItem = navigationItems[0];
	sideNavMode: 'over' | 'push' | 'side';

	isMenuOpened: boolean = this.screenService.sizes['lg'];

	isDarkTheme: boolean = false;

	contentHeight: number;
	constructor() {
		this.sideNavMode = this.calcSideNavMode();
		this.contentHeight = this.calculatePageHeight();
		this.screenService.breakPointChanged.subscribe(() => {
			this.sideNavMode = this.calcSideNavMode();
			this.contentHeight = this.calculatePageHeight();
		});

		this.enableLightTheme();

		this.translationsService.loadTranslations('nl', nlTranslations);
		// this.translationsService.loadTranslations('en', enTranslations);
		// this.translationsService.loadTranslations('fr', frTranslations);
		this.translationsService.setLanguage('nl');
	}

	calcSideNavMode = (): 'over' | 'push' | 'side' => {
		return this.screenService.sizes['lg'] ? 'side' : 'over';
	};
	calculatePageHeight = () => {
		return window.innerHeight - 50;
	};

	selectNavItem(item: NavigationItem) {
		this.selectedNavItem = item;
	}

	async ngOnInit(): Promise<void> {
		await this.authenticationService.signIn({
			email: 'k3vin.belien@gmail.com',
			password: 'Test123',
		});
	}

	handleMenuBtnClick = (evt: Event) => {
		evt.stopPropagation();
		this.isMenuOpened = !this.isMenuOpened;
	};

	enableDarkTheme() {
		this.renderer.removeClass(document.body, 'ch-light-theme');
		this.renderer.addClass(document.body, 'ch-dark-theme');
	}

	enableLightTheme() {
		this.renderer.removeClass(document.body, 'ch-dark-theme');
		this.renderer.addClass(document.body, 'ch-light-theme');
	}

	handleThemeChange = () => {
		this.isDarkTheme = !this.isDarkTheme;
		if (this.isDarkTheme) this.enableDarkTheme();
		else this.enableLightTheme();
	};
}
