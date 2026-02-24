import { Injectable } from '@nestjs/common';
import {
	AccessAction,
	AccessContext,
	AccessDecision,
} from '../../domain/entities/access-control.types';
import { AccessPolicyService } from '../services/access-policy.service';
import { GetUserEntitlementsUseCase } from './get-user-entitlements.usecase';
import { ACCESS_CONTROL_REPOSITORY } from '../../domain/ports/access-control.repository.port';
import { Inject } from '@nestjs/common';
import type { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';

@Injectable()
export class CheckAccessUseCase {
	constructor(
		private readonly getUserEntitlementsUseCase: GetUserEntitlementsUseCase,
		private readonly policyService: AccessPolicyService,
		@Inject(ACCESS_CONTROL_REPOSITORY)
		private readonly repository: AccessControlRepositoryPort
	) {}

	async execute(input: {
		userId: string;
		action: AccessAction;
		context: AccessContext;
	}): Promise<AccessDecision> {
		const normalizedContext = await this.normalizeContext(
			input.userId,
			input.context
		);
		const entitlements = await this.getUserEntitlementsUseCase.execute(
			input.userId
		);
		return this.policyService.decide(
			input.action,
			entitlements,
			normalizedContext
		);
	}

	private async normalizeContext(
		userId: string,
		context: AccessContext
	): Promise<AccessContext> {
		let courseId = context.courseId;
		let moduleId = context.moduleId;
		const lessonId = context.lessonId;

		if (moduleId && !courseId) {
			courseId =
				(await this.repository.getCourseIdByModuleId(moduleId, userId)) ??
				undefined;
		}

		if (lessonId && (!moduleId || !courseId)) {
			const scope = await this.repository.getLessonScopeByLessonId(
				lessonId,
				userId
			);
			if (scope) {
				moduleId = scope.moduleId;
				courseId = scope.courseId;
			}
		}

		return { courseId, moduleId, lessonId };
	}
}
