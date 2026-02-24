export type AccessReasonCode =
	| 'FREEMIUM_SCOPE_RESTRICTED'
	| 'FREEMIUM_AI_BLOCKED'
	| 'TOKEN_LIMIT_EXCEEDED'
	| 'SUBSCRIPTION_REQUIRED'
	| 'RESOURCE_CONTEXT_REQUIRED';

export type AccessAction =
	| 'course.generate_async'
	| 'course.create_manual'
	| 'course.read'
	| 'course.update'
	| 'course.export_scorm'
	| 'course.provider_preferences.update'
	| 'module.create'
	| 'module.read'
	| 'module.update'
	| 'module.delete'
	| 'lesson.read'
	| 'lesson.update'
	| 'lesson.reorder'
	| 'lesson.assets.manage'
	| 'assets.generate'
	| 'quick_actions.execute'
	| 'ai.interaction';

export interface AccessDecision {
	allowed: boolean;
	reasonCode?: AccessReasonCode;
	message?: string;
	upgradeRequired?: boolean;
	nextStep?: 'open_subscription_settings';
}

export interface FreemiumScope {
	sampleCourseId: string | null;
	firstModuleId: string | null;
	firstLessonId: string | null;
}

export interface UserEntitlements {
	planName: string;
	hasActiveSubscription: boolean;
	subscriptionId: string | null;
	monthlyTokenLimit: number;
	usedTokensInPeriod: number;
	remainingTokensInPeriod: number;
	sampleConsumed: boolean;
	sampleGenerationCount: number;
	freemiumScope: FreemiumScope;
	capabilities: {
		canCreateCourse: boolean;
		canAccessPlatform: boolean;
		canUseAI: boolean;
		canGenerateAssets: boolean;
		canExport: boolean;
	};
	primaryRestriction?: {
		code: AccessReasonCode;
		message: string;
		upgradeRequired: boolean;
		nextStep: 'open_subscription_settings';
	};
}

export interface AccessContext {
	courseId?: string;
	moduleId?: string;
	lessonId?: string;
}
