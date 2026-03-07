export interface SaveFileParams {
	buffer: Buffer;
	fileName: string;
	mimetype: string;
	folder?: string; // ex: 'courses/lessons/audio'
}

export abstract class StoragePort {
	abstract save(params: SaveFileParams): Promise<string>;
	abstract delete(fileUrl: string): Promise<void>;
	abstract getSignedUrl(
		fileName: string,
		expiresInSeconds?: number
	): Promise<string>;
}
