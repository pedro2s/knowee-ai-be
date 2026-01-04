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
import { FetchLessonsUseCase } from '../../application/use-cases/fetchLessons.usecase';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/domain/types/user.types';
import { LessonResponseDto } from '../../application/dtos/lesson.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { ModuleResponseDto } from '../../application/dtos/module.response.dto';
import { CreateModuleDto } from '../../application/dtos/create-module.dto';
import { DeleteModuleUseCase } from '../../application/use-cases/delete-module.usecase';
import { UpdateModuleDto } from '../../application/dtos/update-module.dto';
import { UpdateModuleUseCase } from '../../application/use-cases/update-module.usecase';

@Controller('modules')
@UseGuards(SupabaseAuthGuard)
export class ModulesController {
	constructor(
		private readonly createModule: CreateModuleUseCase,
		private readonly deleteModule: DeleteModuleUseCase,
		private readonly updateModule: UpdateModuleUseCase,
		private readonly fetchLessons: FetchLessonsUseCase,
	) {}

	@Post()
	async create(
		@Body() data: CreateModuleDto,
		@CurrentUser() user: UserPayload,
	): Promise<ModuleResponseDto> {
		const module = await this.createModule.execute(data, user.id);
		return ModuleResponseDto.fromDomain(module);
	}

	@Patch('/:id')
	async update(
		@Param('id') id: string,
		@Body() data: UpdateModuleDto,
		@CurrentUser() user: UserPayload,
	): Promise<ModuleResponseDto> {
		const module = await this.updateModule.execute(id, data, user.id);
		return ModuleResponseDto.fromDomain(module);
	}

	@Delete('/:id')
	async delete(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload,
	): Promise<{ deletedModule: ModuleResponseDto }> {
		const { deletedModule } = await this.deleteModule.execute(id, user.id);
		return { deletedModule: ModuleResponseDto.fromDomain(deletedModule) };
	}

	@Get('/:id/lessons')
	async findLessons(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload,
	): Promise<LessonResponseDto[]> {
		const lessons = await this.fetchLessons.execute(id, user.id);
		return lessons.map(LessonResponseDto.fromDomain);
	}
}
