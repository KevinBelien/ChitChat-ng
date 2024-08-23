import {
	ConnectedPosition,
	Overlay,
	OverlayRef,
	PositionStrategy,
	ScrollStrategy,
} from '@angular/cdk/overlay';
import { CdkPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	ElementRef,
	inject,
	input,
	model,
	OnDestroy,
	viewChild,
} from '@angular/core';
import { filter } from 'rxjs';

@Component({
	selector: 'ch-dialog',
	standalone: true,
	imports: [CommonModule, CdkPortal],
	templateUrl: './dialog.component.html',
	styleUrl: './dialog.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent implements OnDestroy {
	private elementRef = inject(ElementRef);
	private overlay = inject(Overlay);

	private portal = viewChild(CdkPortal);

	visible = model<boolean>(false);
	height = input<number | string>('auto');
	width = input<number | string>('auto');
	target = input<HTMLElement>();
	hasBackdrop = input<boolean>(true);
	closeOnBackdropClick = input<boolean>(true);
	backdropClass = input<string | string[]>(
		'cdk-overlay-dark-backdrop'
	);
	positions = input<ConnectedPosition[]>([
		{
			originX: 'center',
			originY: 'center',
			overlayX: 'center',
			overlayY: 'center',
		},
	]);
	scrollStrategy = input<ScrollStrategy>(
		this.overlay.scrollStrategies.block()
	);

	dimensions = computed(() => {
		const height = this.height();
		const width = this.width();

		return {
			height: !isNaN(Number(height)) ? `${height}px` : height,
			width: !isNaN(Number(width)) ? `${width}px` : width,
		};
	});

	private dialogRef?: OverlayRef;

	constructor() {
		effect(() => {
			this.visible() ? this.open(this.target()) : this.close();
		});
	}

	ngOnDestroy(): void {
		this.close();
	}

	private open = (targetElement?: HTMLElement) => {
		const positionStrategy =
			this.handleDialogPositionStrategy(targetElement);

		this.dialogRef = this.createDialog(
			positionStrategy,
			this.hasBackdrop(),
			this.backdropClass()
		);

		this.attachComponentToDialog();

		if (this.closeOnBackdropClick())
			this.setupOnBackdropClickHandler(
				targetElement || this.elementRef
			);
	};

	private setupOnBackdropClickHandler(
		targetElement: HTMLElement | ElementRef
	): void {
		const element =
			targetElement instanceof ElementRef
				? targetElement.nativeElement
				: targetElement;

		let shouldIgnoreNextBackdropClick = false;

		// Mark that the next backdrop click should be ignored
		const handleDialogTrigger = () => {
			shouldIgnoreNextBackdropClick = true;
		};

		// Attach event listeners to the trigger element
		element.addEventListener('pointerup', handleDialogTrigger);
		element.addEventListener('mouseup', handleDialogTrigger);

		// Setup the backdrop click handler
		this.dialogRef
			?.backdropClick()
			.pipe(
				filter(() => {
					if (shouldIgnoreNextBackdropClick) {
						// Reset the flag and ignore this backdrop click
						shouldIgnoreNextBackdropClick = false;
						return false;
					}
					return true;
				})
			)
			.subscribe(() => {
				this.close();
			});
	}

	close = () => {
		if (this.dialogRef) {
			this.dialogRef.dispose();
			this.visible.set(false);
		}
	};

	private handleDialogPositionStrategy = (
		targetElement?: HTMLElement | ElementRef
	) => {
		if (targetElement) {
			return this.overlay
				.position()
				.flexibleConnectedTo(targetElement)
				.withFlexibleDimensions(true)
				.withPush(true)
				.withPositions(this.positions())
				.withGrowAfterOpen(true);
		} else {
			return this.overlay
				.position()
				.global()
				.centerHorizontally()
				.centerVertically();
		}
	};

	private createDialog = (
		positionStrategy?: PositionStrategy,
		hasBackdrop: boolean = true,
		backdropClass: string | string[] = ''
	) => {
		return this.overlay.create({
			positionStrategy,
			hasBackdrop: hasBackdrop,
			backdropClass: backdropClass,
			scrollStrategy: this.scrollStrategy(),
		});
	};

	private attachComponentToDialog = () => {
		const componentRef = this.dialogRef?.attach(this.portal());
		return componentRef;
	};
}
