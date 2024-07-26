import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from 'chit-chat/src/lib/auth';
import { ButtonComponent } from 'chit-chat/src/lib/components/button';
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
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
	private authenticationService = inject(AuthService);
	private screenService = inject(ScreenService);

	readonly navigationItems = [...navigationItems];

	selectedNavItem: NavigationItem = navigationItems[0];
	sideNavMode: 'over' | 'push' | 'side';

	isMenuOpened: boolean = true;

	constructor() {
		this.sideNavMode = this.calcSideNavMode();
		this.screenService.breakPointChanged.subscribe(() => {
			this.sideNavMode = this.calcSideNavMode();
		});
	}

	calcSideNavMode = (): 'over' | 'push' | 'side' => {
		return this.screenService.sizes['lg'] ? 'side' : 'over';
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

	handleMenuBtnClick = (e: Event) => {
		e.stopPropagation();
		this.isMenuOpened = !this.isMenuOpened;
	};
}
