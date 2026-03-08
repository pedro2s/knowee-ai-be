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
}

export interface UploadObjectResult {
	path: string;
	url: string;
}

export abstract class StoragePort {
	abstract upload(params: UploadObjectParams): Promise<UploadObjectResult>;
	abstract deleteObject(params: DeleteObjectParams): Promise<void>;
	abstract download(params: DownloadObjectParams): Promise<Buffer>;
	abstract getPublicUrl(params: GetObjectUrlParams): string;
}
