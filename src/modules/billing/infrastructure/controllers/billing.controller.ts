import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import { type UserPayload } from 'src/shared/domain/types/user-payload';
import { GetUsageUseCase } from '../../application/use-cases/get-usage.usecase';

@Controller('billing')
@UseGuards(SupabaseAuthGuard)
export class BillingController {
	constructor(private readonly getUsageUseCase: GetUsageUseCase) {}

	@Get('usage')
	async getUsage(@CurrentUser() user: UserPayload): Promise<{ used: number }> {
		return this.getUsageUseCase.execute(user.id);
	}
}
