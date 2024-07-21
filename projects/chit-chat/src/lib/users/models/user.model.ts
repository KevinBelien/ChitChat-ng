import {
	MapResult,
	MapResultCollection,
} from 'chit-chat/src/lib/utils';
import { DtoUser } from '../dto';
import { UserStatus, userStatuses } from '../types';

export class User implements DtoUser {
	uid: string;
	name: string;
	roleId: string;
	creationDateMs: number;
	avatar: string | null;
	onlineStatus: UserStatus;
	color: string | null;
	isActivated: boolean;

	constructor(
		uid: string,
		name: string,
		roleId: string,
		creationDateMs: number,
		avatar: string | null,
		onlineStatus: UserStatus,
		color: string | null,
		isActivated: boolean
	) {
		this.uid = uid;
		this.name = name;
		this.roleId = roleId;
		this.creationDateMs = creationDateMs;
		this.avatar = avatar;
		this.onlineStatus = onlineStatus;
		this.color = color;
		this.isActivated = isActivated;
	}

	public static fromDto = (
		dto: DtoUser
	): MapResult<DtoUser, User> => {
		if (!User.isValid(dto.uid, dto))
			return {
				data: null,
				error: new Error(
					`Mapping error: Couldn't map ${dto} to a valid user object\n${JSON.stringify(
						dto
					)}`
				),
			};

		const avatar = !!dto.avatar ? dto.avatar : null;
		const isActivated = !!dto.isActivated ? dto.isActivated : false;
		return {
			data: new User(
				dto.uid,
				dto.name,
				dto.roleId,
				dto.creationDateMs,
				avatar,
				dto.onlineStatus,
				!!dto.color ? dto.color : null,
				isActivated
			),
		};
	};

	public static fromCollection = (
		collection: DtoUser[]
	): MapResultCollection<DtoUser, User> => {
		const mapResult = collection.map((user) => User.fromDto(user));

		const users = mapResult
			.map((result) => result.data)
			.filter((user): user is User => Boolean(user));

		const errors = mapResult.filter((result) =>
			Boolean(result.error)
		);

		return { data: users, errors: errors };
	};

	public static isValid = (
		uid: string | null,
		data: Record<string, any>
	): boolean => {
		if (
			!uid ||
			!data['name'] ||
			!data['creationDateMs'] ||
			!data['roleId'] ||
			!userStatuses.includes(data['onlineStatus'])
		) {
			return false;
		}

		return true;
	};
}
