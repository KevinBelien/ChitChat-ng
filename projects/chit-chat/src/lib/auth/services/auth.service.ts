import { Injectable, inject } from '@angular/core';
import {
	Auth,
	User as FirebaseUser,
	UserCredential,
	authState,
	signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import {
	AuthUser,
	DtoUser,
	User,
	UserService,
} from '@chit-chat/ng-chat/src/lib/users';
import {
	FireStoreCollection,
	MapResult,
} from '@chit-chat/ng-chat/src/lib/utils';

import {
	BehaviorSubject,
	Observable,
	forkJoin,
	from,
	of,
} from 'rxjs';
import {
	catchError,
	distinctUntilChanged,
	map,
	switchMap,
} from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	readonly isLoggedInIntoFirebase$;
	private userService: UserService = inject(UserService);

	user$: BehaviorSubject<AuthUser | null> =
		new BehaviorSubject<AuthUser | null>(null);

	constructor(
		private afs: AngularFirestore,
		private auth: Auth // @Inject(LibConfigService) private config: LibConfig
	) {
		this.isLoggedInIntoFirebase$ = authState(this.auth);
		this.isLoggedInIntoFirebase$
			.pipe(
				switchMap((user: FirebaseUser | null) => {
					//Set online status of user depending if user logged in/off
					const previousUser = this.user$.getValue();

					if (!!user)
						from(
							this.userService.setUserStatus(user.uid, 'available')
						);
					else if (!!previousUser)
						from(
							this.userService.setUserStatus(
								previousUser.userInfo.uid,
								'offline'
							)
						);

					return of(user);
				}),
				switchMap((user: FirebaseUser | null) => {
					return !!user
						? this.getUserByFireBaseUser(user)
						: of({ data: null });
				}),
				catchError((error) => {
					return of({ data: null, error: new Error(error) });
				})
			)
			.subscribe(
				async (user: MapResult<DtoUser, AuthUser | null>) => {
					this.user$.next(user.data);
					if (!!user.error) {
						throw user.error;
					}
				}
			);
	}

	getCurrentUser = (): AuthUser | null => {
		return this.user$.getValue();
	};

	getCurrentFireBaseUser = (): FirebaseUser | null => {
		return this.auth.currentUser;
	};

	getUserByFireBaseUser = (
		user: FirebaseUser
	): Observable<MapResult<DtoUser, AuthUser | null>> => {
		return this.afs
			.collection<DtoUser>(FireStoreCollection.USERS, (ref: any) =>
				ref
					.where('uid', '==', user.uid)
					.where('isActivated', '==', true)
			)
			.valueChanges(user.uid)
			.pipe(
				distinctUntilChanged(),
				switchMap((users) => {
					const userRole$ =
						this.userService.getUserRoleWithPermissions(
							users[0].roleId
						);
					return forkJoin({
						user: of(users[0]),
						userRole: userRole$,
					});
				}),
				map((authUser) => {
					if (!!authUser.userRole.error) {
						return { data: null, error: authUser.userRole.error };
					}

					const mappedUser: MapResult<DtoUser, User> = User.fromDto(
						authUser.user
					);

					if (!!mappedUser.error)
						return { data: null, error: mappedUser.error };

					if (!mappedUser.data || !authUser.userRole.data)
						return {
							data: null,
							error: new Error(
								`${!mappedUser.data ? 'User' : 'UserRole'} is null`
							),
						};

					return {
						data: {
							userInfo: mappedUser.data,
							role: authUser.userRole.data,
						},
					};
				}),
				catchError((error) => {
					return of({ data: null, error: new Error(error) });
				})
			);
	};

	signIn = async (credentials: {
		email: string;
		password: string;
	}): Promise<UserCredential> => {
		return signInWithEmailAndPassword(
			this.auth,
			credentials.email,
			credentials.password
		);
	};

	signOut = async (): Promise<void> => {
		const user = this.getCurrentFireBaseUser();
		if (!user) return;

		return this.auth.signOut();
	};
}
