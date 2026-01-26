export interface ImageGeneratorPort {
	generate(input: {
		prompt: string;
		size: '1024x1024' | '1536x1024' | '1024x1536';
	}): Promise<Buffer>;
}
