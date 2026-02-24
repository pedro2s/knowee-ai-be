import { SetMetadata } from '@nestjs/common';
import { AccessAction } from '../../domain/entities/access-control.types';

export const ACCESS_REQUIREMENT_KEY = 'access_requirement';

export interface AccessRequirementMetadata {
	action: AccessAction;
	params?: {
		courseIdParam?: string;
		moduleIdParam?: string;
		lessonIdParam?: string;
		courseIdBody?: string;
		moduleIdBody?: string;
		lessonIdBody?: string;
	};
}

export const RequireAccess = (
	action: AccessAction,
	params?: AccessRequirementMetadata['params']
) => SetMetadata(ACCESS_REQUIREMENT_KEY, { action, params });
