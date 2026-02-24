export interface SubscriberSnapshot {
	id: string;
	createdAt: string;
	subscribed: boolean;
	tierName: string | null;
	monthlyTokenLimit: number | null;
	sampleCourseId: string | null;
	sampleConsumedAt: string | null;
	sampleGenerationCount: number;
}

export interface AccessControlRepositoryPort {
	getLatestSubscriber(userId: string): Promise<SubscriberSnapshot | null>;
	countUserCourses(userId: string): Promise<number>;
	getFirstCourseId(userId: string): Promise<string | null>;
	getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDateIso: string
	): Promise<number>;
	getFirstModuleId(courseId: string, userId: string): Promise<string | null>;
	getFirstLessonId(moduleId: string, userId: string): Promise<string | null>;
	getCourseIdByModuleId(
		moduleId: string,
		userId: string
	): Promise<string | null>;
	getLessonScopeByLessonId(
		lessonId: string,
		userId: string
	): Promise<{ courseId: string; moduleId: string } | null>;
	markSampleConsumed(userId: string, sampleCourseId: string): Promise<void>;
}

export const ACCESS_CONTROL_REPOSITORY = 'ACCESS_CONTROL_REPOSITORY';
