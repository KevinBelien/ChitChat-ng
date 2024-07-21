import { DtoUserRole } from './user-role.dto';

export interface DtoPermission {
	name: string;
	description: string;
	role: DtoUserRole & { id: string };
}
