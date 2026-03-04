export interface UserPayload {
	id: string;
	email: string;
	role?: string;
	rawUserMetaData?: unknown;
	createdAt?: string;
	updatedAt?: string;
}
