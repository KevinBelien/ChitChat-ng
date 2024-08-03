import { ClickActionType, PointerDeviceType } from '../enums';

export interface ClickEvent {
	event: PointerEvent | KeyboardEvent;
	targetElement: HTMLElement;
	data?: any;
	pointerType?: PointerDeviceType;
	action?: ClickActionType;
}
