import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GenerateModuleUseCase } from '../../application/use-cases/generate-module.usecase';
import { ModuleResponseDto } from '../../application/dtos/module.response.dto';
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import { GenerateModuleDto } from '../../application/dtos/generate-module.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';

@Controller('quick-actions')
@UseGuards(SupabaseAuthGuard)
export class QuickActionsController {
	constructor(private readonly generateModuleUseCase: GenerateModuleUseCase) {}

	@Post('generate-module')
	async generateModule(
		@Body() data: GenerateModuleDto,
		@CurrentUser() user: UserPayload
	): Promise<ModuleResponseDto> {
		const generatedModule = await this.generateModuleUseCase.execute(
			data,
			user.id
		);

		return ModuleResponseDto.fromDomain(generatedModule);
	}

	@Post('reorder-content')
	async reorderContent() {}

	@Post('generate-assessments')
	async generateAssessments() {}
}
