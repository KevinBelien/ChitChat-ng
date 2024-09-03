import { User, UserRole } from '.';

export type AuthUser = {
	userInfo: User;
	role: UserRole;
};
