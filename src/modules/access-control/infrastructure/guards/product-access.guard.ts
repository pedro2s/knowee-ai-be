import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CheckAccessUseCase } from '../../application/use-cases/check-access.usecase';
import {
	ACCESS_REQUIREMENT_KEY,
	AccessRequirementMetadata,
} from '../decorators/require-access.decorator';
import { UserPayload } from 'src/shared/types/user-payload';

@Injectable()
export class ProductAccessGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly checkAccessUseCase: CheckAccessUseCase
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requirement =
			this.reflector.getAllAndOverride<AccessRequirementMetadata>(
				ACCESS_REQUIREMENT_KEY,
				[context.getHandler(), context.getClass()]
			);

		if (!requirement) {
			return true;
		}

		const req = context.switchToHttp().getRequest<Request>();
		const user = req.user as UserPayload | undefined;
		if (!user?.id) {
			return false;
		}

		const params = requirement.params ?? {};
		const body = (req.body ?? {}) as Record<string, unknown>;
		const routeParams = req.params ?? {};

		const action = requirement.action;

		const resolveParam = (
			key: string | undefined,
			source: Record<string, unknown>
		) => {
			if (!key) return undefined;
			const value = source[key];
			return typeof value === 'string' ? value : undefined;
		};

		let courseId =
			resolveParam(params.courseIdParam, routeParams) ??
			(action.startsWith('course.')
				? resolveParam('id', routeParams)
				: undefined);

		let moduleId =
			resolveParam(params.moduleIdParam, routeParams) ??
			(action.startsWith('module.')
				? resolveParam('id', routeParams)
				: undefined);

		let lessonId =
			resolveParam(params.lessonIdParam, routeParams) ??
			(action.startsWith('lesson.')
				? resolveParam('id', routeParams)
				: undefined);

		if (!courseId) {
			courseId =
				resolveParam(params.courseIdBody, body) ??
				(action.startsWith('course.') || action.startsWith('ai.')
					? resolveParam('courseId', body)
					: undefined);
		}

		if (!moduleId) {
			moduleId = resolveParam(params.moduleIdBody, body);
		}

		if (!lessonId) {
			lessonId = resolveParam(params.lessonIdBody, body);
		}

		const decision = await this.checkAccessUseCase.execute({
			userId: user.id,
			action: requirement.action,
			context: {
				courseId,
				moduleId,
				lessonId,
			},
		});

		if (decision.allowed) {
			return true;
		}

		throw new ForbiddenException({
			code: decision.reasonCode ?? 'SUBSCRIPTION_REQUIRED',
			message: decision.message ?? 'Acesso não permitido para esta operação.',
			upgradeRequired: decision.upgradeRequired ?? true,
			nextStep: decision.nextStep ?? 'open_subscription_settings',
		});
	}
}
