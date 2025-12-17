export interface ScriptGeneratorPort {
	generate(input: {
		prompt: string;
		size: '1920x1080' | '1024x1024';
	}): Promise<Buffer>;
}
