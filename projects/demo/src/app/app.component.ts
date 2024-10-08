import { CommonModule } from '@angular/common';
import {
	Component,
	effect,
	inject,
	OnInit,
	Renderer2,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@chit-chat/ng-chat/src/lib/auth';
import { ButtonComponent } from '@chit-chat/ng-chat/src/lib/components/button';
import {
	frTranslations,
	nlTranslations,
	TranslationService,
} from '@chit-chat/ng-chat/src/lib/localization';
import {
	BreakpointState,
	ScreenService,
} from '@chit-chat/ng-chat/src/lib/utils';
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

	isMenuOpened: boolean = ['lg', 'xl'].includes(
		this.screenService.breakpointState()?.current
	);

	isDarkTheme: boolean = false;

	contentHeight: number;
	constructor() {
		this.sideNavMode = this.calcSideNavMode(
			this.screenService.breakpointState()
		);
		this.contentHeight = this.calculatePageHeight();

		effect(() => {
			const breakpoint = this.screenService.breakpointState();

			this.sideNavMode = this.calcSideNavMode(breakpoint);
			this.contentHeight = this.calculatePageHeight();
		});

		this.enableLightTheme();

		this.translationsService.loadTranslations('nl', nlTranslations);
		this.translationsService.loadTranslations('fr', frTranslations);
		this.translationsService.setLanguage('nl');
	}

	calcSideNavMode = (
		breakpoint: BreakpointState
	): 'over' | 'push' | 'side' => {
		return ['lg', 'xl'].includes(breakpoint.current)
			? 'side'
			: 'over';
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
