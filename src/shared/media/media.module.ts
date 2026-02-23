import { Module } from '@nestjs/common';
import { MediaService } from './infrastructure/media.service';
import { MEDIA_SERVICE } from './domain/ports/media.port';

@Module({
	providers: [
		{
			provide: MEDIA_SERVICE,
			useClass: MediaService,
		},
	],
	exports: [MEDIA_SERVICE],
})
export class MediaModule {}
