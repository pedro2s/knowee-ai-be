import { Injectable } from '@nestjs/common';
import { AuthServicePort } from '../../domain/ports/auth.service.port';
import { SignUpDto } from '../dtos/sign-up.dto';
import { CreateFreeSubscriptionUseCase } from 'src/modules/billing/application/use-cases/create-free-subscription.usecase';

@Injectable()
export class SignUpUseCase {
	constructor(
		private readonly authService: AuthServicePort,
		private readonly createFreeSubscriptionUseCase: CreateFreeSubscriptionUseCase
	) {}

	async execute(dto: SignUpDto) {
		const result = await this.authService.signUp(dto);
		await this.createFreeSubscriptionUseCase.execute(
			result.user.id,
			result.user.email ?? dto.email
		);
		return result;
	}
}
