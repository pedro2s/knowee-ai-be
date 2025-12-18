export interface AuthContext {
	userId: string;
	role: 'authenticated' | 'anon' | 'service_role';
}

export interface DbContext {
	runAsUser<T>(
		auth: AuthContext,
		fn: (db: unknown) => Promise<T>,
	): Promise<T>;

	runAsService<T>(fn: (db: unknown) => Promise<T>): Promise<T>;
}
