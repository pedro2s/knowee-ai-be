export interface UploadObjectParams {
	bucket: string;
	path: string;
	buffer: Buffer;
	contentType: string;
	upsert?: boolean;
}

export interface DeleteObjectParams {
	bucket: string;
	path: string;
}

export interface DownloadObjectParams {
	bucket: string;
	path: string;
}

export interface GetObjectUrlParams {
	bucket: string;
	path: string;
	expiresInSeconds?: number;
	disposition?: 'inline' | 'attachment';
	filename?: string;
}

export interface UploadObjectResult {
	path: string;
	url: string;
}

export abstract class StoragePort {
	abstract upload(params: UploadObjectParams): Promise<UploadObjectResult>;
	abstract deleteObject(params: DeleteObjectParams): Promise<void>;
	abstract download(params: DownloadObjectParams): Promise<Buffer>;
	abstract getAccessUrl(params: GetObjectUrlParams): Promise<string>;
}
