import { ClickActionType, PointerDeviceType } from '../enums';

export interface ClickEvent {
	event: PointerEvent | KeyboardEvent;
	data?: any;
	pointerType?: PointerDeviceType;
	action?: ClickActionType;
}
