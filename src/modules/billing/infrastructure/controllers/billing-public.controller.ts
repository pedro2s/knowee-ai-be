import { Controller, Get } from '@nestjs/common';
import { GetPublicPlansUseCase } from '../../application/use-cases/get-public-plans.usecase';
import { PublicBillingPlansResponseDto } from '../../application/dtos/public-billing-plans.response.dto';

@Controller('billing')
export class BillingPublicController {
	constructor(private readonly getPublicPlansUseCase: GetPublicPlansUseCase) {}

	@Get('plans')
	async getPublicPlans(): Promise<PublicBillingPlansResponseDto> {
		return this.getPublicPlansUseCase.execute();
	}
}
