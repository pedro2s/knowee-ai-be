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

		const decision = await this.checkAccessUseCase.execute({
			userId: user.id,
			action: requirement.action,
			context: {
				courseId:
					(routeParams[params.courseIdParam ?? 'id'] as string | undefined) ??
					(body[params.courseIdBody ?? 'courseId'] as string | undefined),
				moduleId:
					(routeParams[params.moduleIdParam ?? 'id'] as string | undefined) ??
					(body[params.moduleIdBody ?? 'moduleId'] as string | undefined),
				lessonId:
					(routeParams[params.lessonIdParam ?? 'id'] as string | undefined) ??
					(body[params.lessonIdBody ?? 'lessonId'] as string | undefined),
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
