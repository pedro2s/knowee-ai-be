import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	ParseUUIDPipe,
	Param,
	Patch,
	Post,
	Res,
	StreamableFile,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { GenerateCourseUseCase } from '../../application/use-cases/generate-course.usecase';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { FetchCoursesUseCase } from '../../application/use-cases/fetch-courses.usecase';
import { CourseResponseDto } from '../../application/dtos/course.response.dto';
import { GenerateCourseDto } from '../../application/dtos/generate-course.dto';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { CourseSummaryResponseDto } from '../../application/dtos/course-summary.response.dto';
import { GetCourseUseCase } from '../../application/use-cases/get-course.usecase';
import { ModuleResponseDto } from '../../application/dtos/module.response.dto';
import { FetchModulesUseCase } from '../../application/use-cases/fetch-modules.usecase';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateCourseDto } from '../../application/dtos/update-course.dto';
import { UpdateCourseWithModuleTreeUseCase } from '../../application/use-cases/update-course-with-module-tree.usecase';
import { ExportCourseScormUseCase } from '../../application/use-cases/export-course-scorm.usecase';
import { ExportScormDto } from '../../application/dtos/export-scorm.dto';
import type { Response } from 'express';
import { createReadStream } from 'fs';

@Controller('courses')
@UseGuards(SupabaseAuthGuard)
export class CoursesController {
	constructor(
		private readonly createCourse: GenerateCourseUseCase,
		private readonly fetchCourses: FetchCoursesUseCase,
		private readonly getCourse: GetCourseUseCase,
		private readonly fetchModules: FetchModulesUseCase,
		private readonly updateCourse: UpdateCourseWithModuleTreeUseCase,
		private readonly exportCourseScormUseCase: ExportCourseScormUseCase
	) {}

	// 1. Rotas Específicas (SEM ID) - Devem vir PRIMEIRO

	// ...

	// 2. Rotas Específicas (COM ID)

	@Get('/:id/modules')
	async findModules(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload
	): Promise<ModuleResponseDto[]> {
		const modules = await this.fetchModules.execute(id, user.id);
		return modules.map((module) => ModuleResponseDto.fromDomain(module));
	}

	// 3. Rotas Genéricas (CRUD) - Devem vir POR ÚLTIMO

	@Post()
	@UseInterceptors(FilesInterceptor('files'))
	async create(
		@UploadedFiles() files: Express.Multer.File[],
		@Body() body: GenerateCourseDto,
		@CurrentUser() user: UserPayload
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
		@CurrentUser() user: UserPayload
	): Promise<CourseSummaryResponseDto[]> {
		const courses = await this.fetchCourses.execute(user.id);
		return courses.map((course) => CourseSummaryResponseDto.fromDomain(course));
	}

	@Get('/:id')
	async findOne(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload
	): Promise<CourseResponseDto> {
		const course = await this.getCourse.execute({
			id,
			userId: user.id,
		});
		return CourseResponseDto.fromDomain(course);
	}

	@Patch('/:id')
	async update(
		@Param('id') id: string,
		@Body() data: UpdateCourseDto,
		@CurrentUser() user: UserPayload
	): Promise<CourseResponseDto> {
		const course = await this.updateCourse.execute(id, data, user.id);
		return CourseResponseDto.fromDomain(course);
	}

	@Post('/:id/export/scorm')
	@HttpCode(200)
	async exportScorm(
		@Param(
			'id',
			new ParseUUIDPipe({
				exceptionFactory: () =>
					new BadRequestException('id deve ser um UUID válido'),
			})
		)
		id: string,
		@Body() payload: ExportScormDto,
		@CurrentUser() user: UserPayload,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const { zipPath, fileName, cleanup } =
			await this.exportCourseScormUseCase.execute(id, user.id, payload);

		let cleaned = false;
		const safeCleanup = async () => {
			if (cleaned) return;
			cleaned = true;
			await cleanup();
		};

		void res.on('finish', () => {
			void safeCleanup();
		});
		void res.on('close', () => {
			void safeCleanup();
		});

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

		return new StreamableFile(createReadStream(zipPath));
	}
}
