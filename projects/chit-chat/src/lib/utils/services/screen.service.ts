import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScreenService implements OnDestroy {
	breakPointChanged = new Subject<void>();

	breakPointObserverSubscription: Subscription;

	constructor(private breakpointObserver: BreakpointObserver) {
		this.breakPointObserverSubscription = this.breakpointObserver
			.observe([
				Breakpoints.XSmall,
				Breakpoints.Small,
				Breakpoints.Medium,
				Breakpoints.Large,
			])
			.subscribe(() => {
				this.breakPointChanged.next();
			});
	}

	public get sizes(): Record<string, boolean> {
		const breakPoints = {
			xs: this.breakpointObserver.isMatched(Breakpoints.XSmall),
			sm: this.breakpointObserver.isMatched(Breakpoints.Small),
			md: this.breakpointObserver.isMatched(Breakpoints.Medium),
			lg: this.breakpointObserver.isMatched(Breakpoints.Large),
			xl: this.breakpointObserver.isMatched(Breakpoints.XLarge),
		};

		return {
			xs:
				breakPoints.xs ||
				breakPoints.sm ||
				breakPoints.md ||
				breakPoints.lg ||
				breakPoints.xl,
			sm:
				breakPoints.sm ||
				breakPoints.md ||
				breakPoints.lg ||
				breakPoints.xl,
			md: breakPoints.md || breakPoints.lg || breakPoints.xl,
			lg: breakPoints.lg || breakPoints.xl,
			xl: breakPoints.xl,
		};
	}

	isMobile = () => {
		return (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			) ||
			(navigator.userAgent.includes('Mac') &&
				'ontouchend' in document)
		);
	};

	isIos = () => {
		return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
	};

	ngOnDestroy(): void {
		this.breakPointObserverSubscription.unsubscribe();
	}
}
