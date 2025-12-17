export interface AudioGeneratorPort {
	generate(input: { text: string; voice?: string }): Promise<Buffer>;
}
