import { IsIn, IsOptional, IsString } from 'class-validator';

export class LessonMediaAccessQueryDto {
	@IsIn(['audio', 'pdf', 'finalVideo', 'sectionVideo'])
	kind: 'audio' | 'pdf' | 'finalVideo' | 'sectionVideo';

	@IsOptional()
	@IsString()
	sectionId?: string;

	@IsOptional()
	@IsIn(['inline', 'attachment'])
	disposition?: 'inline' | 'attachment';
}
