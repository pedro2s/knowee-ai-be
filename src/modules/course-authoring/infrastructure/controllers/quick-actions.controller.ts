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
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import { GenerateModuleDto } from '../../application/dtos/generate-module.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { ReorderContentUseCase } from '../../application/use-cases/quick-actions/georder-content.usecase';

@Controller('quick-actions')
@UseGuards(SupabaseAuthGuard)
export class QuickActionsController {
	constructor(
		private readonly generateModuleUseCase: GenerateModuleUseCase,
		private readonly reorderContentUseCase: ReorderContentUseCase
	) {}

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
	async generateAssessments() {}
}
