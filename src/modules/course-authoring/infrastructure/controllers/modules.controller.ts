import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { CreateModuleUseCase } from '../../application/use-cases/create-module.usecase';
import { GetModuleUseCase } from '../../application/use-cases/get-module.usecase';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { ModuleResponseDto } from '../../application/dtos/module.response.dto';
import { CreateModuleDto } from '../../application/dtos/create-module.dto';
import { DeleteModuleUseCase } from '../../application/use-cases/delete-module.usecase';
import { UpdateModuleDto } from '../../application/dtos/update-module.dto';
import { UpdateModuleUseCase } from '../../application/use-cases/update-module.usecase';
import { ProductAccessGuard } from 'src/modules/access-control/infrastructure/guards/product-access.guard';
import { RequireAccess } from 'src/modules/access-control/infrastructure/decorators/require-access.decorator';
import { GetUserEntitlementsUseCase } from 'src/modules/access-control/application/use-cases/get-user-entitlements.usecase';

@Controller('modules')
@UseGuards(SupabaseAuthGuard, ProductAccessGuard)
export class ModulesController {
	constructor(
		private readonly createModule: CreateModuleUseCase,
		private readonly getModule: GetModuleUseCase,
		private readonly deleteModule: DeleteModuleUseCase,
		private readonly updateModule: UpdateModuleUseCase,
		private readonly getUserEntitlementsUseCase: GetUserEntitlementsUseCase
	) {}

	@Post()
	@RequireAccess('module.create', { courseIdBody: 'courseId' })
	async create(
		@Body() data: CreateModuleDto,
		@CurrentUser() user: UserPayload
	): Promise<ModuleResponseDto> {
		const module = await this.createModule.execute(data, user.id);
		return ModuleResponseDto.fromDomain(module);
	}

	@Get('/:id')
	@RequireAccess('module.read')
	async get(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload
	): Promise<ModuleResponseDto> {
		const module = await this.getModule.execute(id, user.id);
		const entitlements = await this.getUserEntitlementsUseCase.execute(user.id);
		const dto = ModuleResponseDto.fromDomain(module);
		return this.restrictModuleDtoForFreemium(dto, entitlements);
	}

	@Patch('/:id')
	@RequireAccess('module.update')
	async update(
		@Param('id') id: string,
		@Body() data: UpdateModuleDto,
		@CurrentUser() user: UserPayload
	): Promise<ModuleResponseDto> {
		const module = await this.updateModule.execute(id, data, user.id);
		return ModuleResponseDto.fromDomain(module);
	}

	@Delete('/:id')
	@RequireAccess('module.delete')
	async delete(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload
	): Promise<{ deletedModule: ModuleResponseDto }> {
		const { deletedModule } = await this.deleteModule.execute(id, user.id);
		return { deletedModule: ModuleResponseDto.fromDomain(deletedModule) };
	}

	private restrictModuleDtoForFreemium(
		module: ModuleResponseDto,
		entitlements: Awaited<ReturnType<GetUserEntitlementsUseCase['execute']>>
	): ModuleResponseDto {
		const isFreemiumScoped =
			!entitlements.hasActiveSubscription && entitlements.sampleConsumed;
		if (!isFreemiumScoped) {
			return module;
		}

		return {
			...module,
			lessons: (module.lessons ?? []).filter(
				(lesson) => lesson.id === entitlements.freemiumScope.firstLessonId
			),
		};
	}
}
