import { Injectable } from '@nestjs/common';
import { GetMyLegalAcceptanceUseCase } from './get-my-legal-acceptance.usecase';

@Injectable()
export class CheckCurrentLegalAcceptanceUseCase {
	constructor(
		private readonly getMyLegalAcceptanceUseCase: GetMyLegalAcceptanceUseCase
	) {}

	async execute(userId: string): Promise<boolean> {
		const status = await this.getMyLegalAcceptanceUseCase.execute(
			userId,
			'terms_of_use'
		);

		return !status.pendingAcceptance;
	}
}
