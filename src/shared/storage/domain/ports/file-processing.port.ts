import { InputFile } from 'src/modules/course-authoring/domain/entities/course.types';

export const FILE_PROCESSING_SERVICE = 'FileProcessingService';

export interface FileProcessingPort {
	extractTextFromFiles(files: InputFile[]): Promise<string>;
}
