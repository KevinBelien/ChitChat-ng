import { UserStatus } from '../types';

export interface DtoUser {
	uid: string;
	name: string;
	roleId: string;
	creationDateMs: number;
	avatar: string | null;
	onlineStatus: UserStatus;
	color: string | null;
	isActivated: boolean;
}
