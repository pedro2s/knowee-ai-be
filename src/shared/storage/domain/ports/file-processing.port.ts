import { InputFile } from 'src/modules/course-authoring/domain/entities/course.types';

export abstract class FileProcessingPort {
	abstract extractTextFromFiles(files: InputFile[]): Promise<string>;
}
