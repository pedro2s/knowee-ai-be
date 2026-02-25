import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	ParseUUIDPipe,
	Post,
	UseGuards,
} from '@nestjs/common';
import { GenerateModuleUseCase } from '../../application/use-cases/generate-module.usecase';
import { ModuleResponseDto } from '../../application/dtos/module.response.dto';
import type { UserPayload } from 'src/shared/types/user-payload';
import { CurrentUser } from 'src/shared/decorators';
import { GenerateModuleDto } from '../../application/dtos/generate-module.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { ReorderContentUseCase } from '../../application/use-cases/quick-actions/georder-content.usecase';
import { GenerateAssessmentsUseCase } from '../../application/use-cases/quick-actions/generate-assessments.usecase';
import { ProductAccessGuard } from 'src/modules/access-control/infrastructure/guards/product-access.guard';
import { RequireAccess } from 'src/modules/access-control/infrastructure/decorators/require-access.decorator';

@Controller('quick-actions')
@UseGuards(SupabaseAuthGuard, ProductAccessGuard)
export class QuickActionsController {
	constructor(
		private readonly generateModuleUseCase: GenerateModuleUseCase,
		private readonly reorderContentUseCase: ReorderContentUseCase,
		private readonly generateAssessmentsUseCase: GenerateAssessmentsUseCase
	) {}

	@Post('generate-module')
	@RequireAccess('quick_actions.execute')
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
	@RequireAccess('quick_actions.execute')
	@HttpCode(200)
	async reorderContent(
		@Body(
			'courseId',
			new ParseUUIDPipe({
				exceptionFactory: () =>
					new BadRequestException('courseId deve ser um UUID válido'),
			})
		)
		courseId: string,
		@CurrentUser() user: UserPayload
	): Promise<{ message: string }> {
		await this.reorderContentUseCase.execute(courseId, user.id);
		return { message: 'Conteúdo reordenado com sucesso' };
	}

	@Post('generate-assessments')
	@RequireAccess('quick_actions.execute')
	@HttpCode(200)
	async generateAssessments(
		@Body(
			'courseId',
			new ParseUUIDPipe({
				exceptionFactory: () =>
					new BadRequestException('courseId deve ser um UUID válido'),
			})
		)
		courseId: string,
		@CurrentUser() user: UserPayload
	): Promise<{ message: string }> {
		await this.generateAssessmentsUseCase.execute(courseId, user.id);
		return { message: 'Avaliações geradas com sucesso' };
	}
}
