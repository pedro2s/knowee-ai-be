export interface ImageGeneratorPort {
	generate(input: {
		prompt: string;
		size: '1920x1080' | '1024x1024';
	}): Promise<Buffer>;
}
