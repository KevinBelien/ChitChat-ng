import {
	BreakpointObserver,
	Breakpoints,
	BreakpointState as CdkBreakpointState,
} from '@angular/cdk/layout';
import {
	DestroyRef,
	inject,
	Injectable,
	Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
	Breakpoint,
	breakpoints,
	BreakpointState,
	BreakpointStatus,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ScreenService {
	destroyRef = inject(DestroyRef);
	breakpointObserver = inject(BreakpointObserver);

	breakpointState: Signal<BreakpointState>;

	constructor() {
		this.breakpointState = toSignal(
			this.breakpointObserver
				.observe([
					Breakpoints.XSmall,
					Breakpoints.Small,
					Breakpoints.Medium,
					Breakpoints.Large,
				])
				.pipe(
					map<CdkBreakpointState, BreakpointState>(() =>
						this.calculateBreakpoints()
					)
				),
			{ initialValue: this.calculateBreakpoints() }
		);
	}

	calculateBreakpoints = (): BreakpointState => {
		const breakpointStatus = this.getBreakpoints();

		return {
			current: this.getCurrentBreakpoint(breakpointStatus),
			breakpoints: this.calculateBreakpointStatus(breakpointStatus),
		};
	};

	getBreakpoints = (): BreakpointStatus => {
		return {
			xs: this.breakpointObserver.isMatched(Breakpoints.XSmall),
			sm: this.breakpointObserver.isMatched(Breakpoints.Small),
			md: this.breakpointObserver.isMatched(Breakpoints.Medium),
			lg: this.breakpointObserver.isMatched(Breakpoints.Large),
			xl: this.breakpointObserver.isMatched(Breakpoints.XLarge),
		};
	};

	getCurrentBreakpoint = (
		breakpointStatus: BreakpointStatus
	): Breakpoint => {
		return (
			breakpoints.find(
				(breakpoint) => breakpointStatus[breakpoint]
			) || 'xs'
		);
	};

	calculateBreakpointStatus = (
		breakpointStatus: BreakpointStatus
	): BreakpointStatus => {
		return {
			xs:
				breakpointStatus.xs ||
				breakpointStatus.sm ||
				breakpointStatus.md ||
				breakpointStatus.lg ||
				breakpointStatus.xl,
			sm:
				breakpointStatus.sm ||
				breakpointStatus.md ||
				breakpointStatus.lg ||
				breakpointStatus.xl,
			md:
				breakpointStatus.md ||
				breakpointStatus.lg ||
				breakpointStatus.xl,
			lg: breakpointStatus.lg || breakpointStatus.xl,
			xl: breakpointStatus.xl,
		};
	};

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
}
