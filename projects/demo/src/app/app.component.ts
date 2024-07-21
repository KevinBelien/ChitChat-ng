import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from 'chit-chat/src/lib/auth';
import { ButtonComponent } from 'chit-chat/src/lib/components/button';
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
	authenticationService = inject(AuthService);

	readonly navigationItems = [...navigationItems];

	selectedNavItem: NavigationItem = navigationItems[0];

	selectNavItem(item: NavigationItem) {
		this.selectedNavItem = item;
	}

	async ngOnInit(): Promise<void> {
		await this.authenticationService.signIn({
			email: 'k3vin.belien@gmail.com',
			password: 'Test123',
		});
	}
}
