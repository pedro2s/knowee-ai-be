export interface ScormExportLesson {
	id: string;
	title: string;
	description: string | null;
	lessonType: 'video' | 'audio' | 'quiz' | 'pdf' | 'external' | 'article';
	duration: number | null;
	content: Record<string, unknown>;
	resolvedMediaUrl: string | null;
	shouldUseVideoFallback: boolean;
}

export interface ScormExportModule {
	id: string;
	title: string;
	description: string | null;
	orderIndex: number;
	lessons: ScormExportLesson[];
}

export interface ScormCourseExportInput {
	id: string;
	title: string;
	description: string | null;
	category: string | null;
	level: string | null;
	duration: string | null;
	targetAudience: string | null;
	objectives: string | null;
	modules: ScormExportModule[];
}
