import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckCurrentLegalAcceptanceUseCase } from '../../application/use-cases/check-current-legal-acceptance.usecase';
import { UserPayload } from 'src/shared/types/user-payload';

@Injectable()
export class LegalAcceptanceGuard implements CanActivate {
	constructor(
		private readonly checkCurrentLegalAcceptanceUseCase: CheckCurrentLegalAcceptanceUseCase
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const user = request.user as UserPayload | undefined;

		if (!user?.id) {
			return false;
		}

		const accepted = await this.checkCurrentLegalAcceptanceUseCase.execute(
			user.id
		);

		if (accepted) {
			return true;
		}

		throw new ForbiddenException({
			code: 'TERMS_ACCEPTANCE_REQUIRED',
			message:
				'Voce precisa aceitar a versao atual do Termo de Uso da Knowee para continuar.',
			nextStep: 'open_terms_acceptance',
		});
	}
}
