import { Injectable } from '@nestjs/common';
import { ScriptGeneratorPort } from 'src/modules/course-authoring/domain/ports/script-generator.port';

@Injectable()
export class OpenAIScriptGeneratorAdapter implements ScriptGeneratorPort {
	generate(input: {
		prompt: string;
		size: '1920x1080' | '1024x1024';
	}): Promise<Buffer> {
		throw new Error('Method not implemented.');
	}
}
