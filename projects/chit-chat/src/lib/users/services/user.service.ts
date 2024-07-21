import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import {
	FireStoreCollection,
	MapResult,
} from 'chit-chat/src/lib/utils';

import {
	collection,
	doc,
	getFirestore,
	setDoc,
} from 'firebase/firestore';
import {
	Observable,
	catchError,
	distinctUntilChanged,
	map,
	retry,
	startWith,
	throwError,
} from 'rxjs';
import { DtoPermission, DtoUser, DtoUserRole } from '../dto';
import { User, UserRole } from '../models';
import { UserStatus } from '../types';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	constructor(private afs: AngularFirestore) {
		// const user: DtoUser = {
		// 	uid: 'zX3f1LIbs1XceEcOMKkIh9vMYkz1',
		// 	name: 'Test again',
		// 	roleId: 'admin',
		// 	creationDate: new Date(),
		// 	avatar: null,
		// 	onlineStatus: 'available',
		// 	isActivated: true,
		// };
		// this.createUser(user);
	}

	getUsers = (
		activatedUsersOnly: boolean = false
	): Observable<User[]> => {
		return this.afs
			.collection<DtoUser>(FireStoreCollection.USERS, (ref) =>
				!!activatedUsersOnly
					? ref.where('isActivated', '==', true).orderBy('name')
					: ref.orderBy('name')
			)
			.valueChanges()
			.pipe(
				distinctUntilChanged(),
				map<DtoUser[], User[]>(
					(result) => User.fromCollection(result).data
				),
				catchError((error: any) => {
					console.error(error);
					return throwError(
						() =>
							new Error(
								`Error occurred while fetching users.${error}`
							)
					).pipe(startWith([] as User[]));
				}),
				retry(3)
			);
	};

	// getUsersBatch = (
	// 	lastSeenName: string | null,
	// 	batchSize: number,
	// 	activatedUsersOnly: boolean = false
	// ): Observable<any> => {
	// 	return this.afs
	// 		.collection<DtoUser>(FireStoreCollection.USERS, (ref) =>
	// 			!!activatedUsersOnly
	// 				? ref
	// 						.where('isActivated', '==', true)
	// 						.orderBy('name')
	// 						.startAfter(lastSeenName)
	// 						.limit(batchSize)
	// 				: ref
	// 						.orderBy('name')
	// 						.startAfter(lastSeenName)
	// 						.limit(batchSize)
	// 		)
	// 		.snapshotChanges()
	// 		.pipe(
	// 			distinctUntilChanged(),
	// 			map((result) => {
	// 				return result.reduce((acc, cur) => {
	// 					const id = cur.payload.doc.id;
	// 					const data = cur.payload.doc.data();
	// 					return { ...acc, [id]: data };
	// 				}, {});
	// 			})
	// 			// map<DtoUser[], MapResultCollection<DtoUser>>((result) =>
	// 			// 	User.fromCollection(result)
	// 			// ),
	// 		);
	// };

	setUserStatus = async (
		documentID: string,
		status: UserStatus
	): Promise<void> => {
		return this.afs
			.collection(FireStoreCollection.USERS)
			.doc(documentID)
			.update({ onlineStatus: status });
	};

	createUser = async (data: DtoUser): Promise<void> => {
		const fireStore = getFirestore();
		const usersRef = collection(fireStore, FireStoreCollection.USERS);

		try {
			return await setDoc(
				doc(usersRef, data.uid),
				JSON.parse(JSON.stringify(data))
			);
		} catch (e: any) {
			throw Error(
				`Something went wrong when creating user with uid ${data.uid}. ${e}`
			);
		}
	};

	getUserRoleWithPermissions = (
		roleId: string
	): Observable<MapResult<DtoUserRole, UserRole>> => {
		const query = this.afs
			.collection<DtoUserRole>(FireStoreCollection.ROLES)
			.doc(roleId)
			.collection<DtoPermission>(
				FireStoreCollection.ROLES_PERMISSIONS
			);
		return query.get().pipe(
			map((result) => {
				const permissions: (DtoPermission & { id: string })[] =
					result.docs.map((permission) =>
						Object.assign(permission.data(), {
							id: permission.ref.id,
						})
					);

				return UserRole.fromPermissionDto(permissions);
			}),
			catchError((error: any) => {
				console.error(error);
				return throwError(
					() =>
						new Error(
							`Error occurred while fetching user roles.${error}`
						)
				);
			}),
			retry(3)
		);
	};
}
