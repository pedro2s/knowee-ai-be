export class LessonMediaAccessResponseDto {
	url: string;
	expiresAt: string;

	constructor(props: LessonMediaAccessResponseDto) {
		Object.assign(this, props);
	}
}
