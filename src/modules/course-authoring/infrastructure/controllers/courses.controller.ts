import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/create-course.usecase';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { FetchCoursesUseCase } from '../../application/use-cases/fetch-courses.usecase';
import { CourseResponseDto } from '../../application/dtos/course.response.dto';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/domain/types/user.types';
import { CourseSummaryResponseDto } from '../../application/dtos/course-summary.response.dto';
import { GetCourseUseCase } from '../../application/use-cases/get-course.usecase';
import { ModuleResponseDto } from '../../application/dtos/module.response.dto';
import { FetchModulesUseCase } from '../../application/use-cases/fetch-modules.usecase';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('courses')
@UseGuards(SupabaseAuthGuard)
export class CoursesController {
	constructor(
		private readonly createCourse: CreateCourseUseCase,
		private readonly fetchCourses: FetchCoursesUseCase,
		private readonly getCourse: GetCourseUseCase,
		private readonly fetchModules: FetchModulesUseCase,
	) {}

	@Post()
	@UseInterceptors(FilesInterceptor('files'))
	async create(
		@UploadedFiles() files: Express.Multer.File[],
		@Body() body: CreateCourseDto,
		@CurrentUser() user: UserPayload,
	): Promise<CourseResponseDto> {
		// 1. Chama o Caso de Uso passando os dados validos
		const courseEntity = await this.createCourse.execute({
			...body,
			files,
			userId: user.id,
		});

		// 2. Converte a Entidade de Domínio para o Contrato da API (Response DTO)
		return CourseResponseDto.fromDomain(courseEntity);
	}

	@Get()
	async findAll(
		@CurrentUser() user: UserPayload,
	): Promise<CourseSummaryResponseDto[]> {
		const courses = await this.fetchCourses.execute(user.id);
		return courses.map(CourseSummaryResponseDto.fromDomain);
	}

	@Get('/:id')
	async findOne(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload,
	): Promise<CourseResponseDto> {
		const course = await this.getCourse.execute({
			id,
			userId: user.id,
		});
		return CourseResponseDto.fromDomain(course);
	}

	@Get('/:id/modules')
	async findModules(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload,
	): Promise<ModuleResponseDto[]> {
		const modules = await this.fetchModules.execute(id, user.id);
		return modules.map(ModuleResponseDto.fromDomain);
	}
}
