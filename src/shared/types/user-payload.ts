export interface UserPayload {
	id: string;
	email: string;
	// Adicione outras propriedades do usuário conforme necessário
	rawUserMetaData: unknown;
	createdAt: string;
	updatedAt?: string;
}
