import { Module } from '@nestjs/common';
import { MediaService } from './infrastructure/media.service';
import { MediaPort } from './domain/ports/media.port';

@Module({
	providers: [
		{
			provide: MediaPort,
			useClass: MediaService,
		},
	],
	exports: [MediaPort],
})
export class MediaModule {}
