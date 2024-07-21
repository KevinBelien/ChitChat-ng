import { User, UserRole } from '../models';

export type AuthUser = {
	userInfo: User;
	role: UserRole;
};
