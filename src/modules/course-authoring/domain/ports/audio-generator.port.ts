export interface AudioGeneratorPort {
	generate(input: {
		text: string;
		voice?: string;
		style?: string;
	}): Promise<Buffer>;
}
