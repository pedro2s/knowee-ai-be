export interface SubscriberSnapshot {
	id: string;
	createdAt: string;
	status: 'free' | 'active' | 'past_due' | 'canceled';
	tierName: string | null;
	monthlyTokenLimit: number | null;
	sampleCourseId: string | null;
	sampleConsumedAt: string | null;
	sampleGenerationCount: number;
}

export abstract class AccessControlRepositoryPort {
	abstract getLatestSubscriber(
		userId: string
	): Promise<SubscriberSnapshot | null>;
	abstract countUserCourses(userId: string): Promise<number>;
	abstract getFirstCourseId(userId: string): Promise<string | null>;
	abstract getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDateIso: string
	): Promise<number>;
	abstract getFirstModuleId(
		courseId: string,
		userId: string
	): Promise<string | null>;
	abstract getFirstLessonId(
		moduleId: string,
		userId: string
	): Promise<string | null>;
	abstract getCourseIdByModuleId(
		moduleId: string,
		userId: string
	): Promise<string | null>;
	abstract getLessonScopeByLessonId(
		lessonId: string,
		userId: string
	): Promise<{ courseId: string; moduleId: string } | null>;
	abstract markSampleConsumed(
		userId: string,
		sampleCourseId: string
	): Promise<void>;
}
