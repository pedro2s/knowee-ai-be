import { ScriptSection } from '../../domain/entities/lesson-script.types';

export class GeneratedSectionVideoResponseDto {
	videoUrl: string;
	videoDuration: number;
	videoStatus: 'pending' | 'generating' | 'ready' | 'error';
	isRecorded: boolean;

	private constructor(props: GeneratedSectionVideoResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(
		generatedSectionVideo: ScriptSection
	): GeneratedSectionVideoResponseDto {
		return new GeneratedSectionVideoResponseDto({
			videoDuration: generatedSectionVideo.videoDuration || 0,
			videoStatus: generatedSectionVideo.videoStatus || 'pending',
			videoUrl: generatedSectionVideo.videoUrl || '',
			isRecorded: generatedSectionVideo.isRecorded || false,
		});
	}
}
