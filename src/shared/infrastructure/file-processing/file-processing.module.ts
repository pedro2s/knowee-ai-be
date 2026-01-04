import { Module } from '@nestjs/common';
import { FileProcessingService } from './file-processing.service';
import { FILE_PROCESSING_SERVICE } from '../../application/ports/file-processing.port';

@Module({
	providers: [
		{
			provide: FILE_PROCESSING_SERVICE,
			useClass: FileProcessingService,
		},
	],
	exports: [FILE_PROCESSING_SERVICE],
})
export class FileProcessingModule {}
