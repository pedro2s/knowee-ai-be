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
	Put,
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
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
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
import { StartCourseGenerationUseCase } from '../../application/use-cases/start-course-generation.usecase';
import { StartCourseGenerationResponseDto } from '../../application/dtos/start-course-generation.response.dto';
import { UpdateProviderPreferencesUseCase } from 'src/modules/provider-preferences/application/use-cases/update-provider-preferences.usecase';
import { UpdateProviderPreferencesDto } from 'src/modules/provider-preferences/application/dtos/update-provider-preferences.dto';
import { EffectiveProviderPreferencesResponseDto } from 'src/modules/provider-preferences/application/dtos/provider-preferences.response.dto';
import { GetProviderPreferencesUseCase } from 'src/modules/provider-preferences/application/use-cases/get-provider-preferences.usecase';
import { ProductAccessGuard } from 'src/modules/access-control/infrastructure/guards/product-access.guard';
import { RequireAccess } from 'src/modules/access-control/infrastructure/decorators/require-access.decorator';
import { GetUserEntitlementsUseCase } from 'src/modules/access-control/application/use-cases/get-user-entitlements.usecase';

@Controller('courses')
@UseGuards(SupabaseAuthGuard, ProductAccessGuard)
export class CoursesController {
	constructor(
		private readonly createCourse: GenerateCourseUseCase,
		private readonly startCourseGenerationUseCase: StartCourseGenerationUseCase,
		private readonly updateProviderPreferencesUseCase: UpdateProviderPreferencesUseCase,
		private readonly getProviderPreferencesUseCase: GetProviderPreferencesUseCase,
		private readonly getUserEntitlementsUseCase: GetUserEntitlementsUseCase,
		private readonly fetchCourses: FetchCoursesUseCase,
		private readonly getCourse: GetCourseUseCase,
		private readonly fetchModules: FetchModulesUseCase,
		private readonly updateCourse: UpdateCourseWithModuleTreeUseCase,
		private readonly exportCourseScormUseCase: ExportCourseScormUseCase
	) {}

	// 1. Rotas Específicas (SEM ID) - Devem vir PRIMEIRO

	@Post('/generate-async')
	@RequireAccess('course.generate_async')
	@UseInterceptors(FilesInterceptor('files'))
	async createAsync(
		@UploadedFiles() files: Express.Multer.File[],
		@Body() body: GenerateCourseDto,
		@CurrentUser() user: UserPayload
	): Promise<StartCourseGenerationResponseDto> {
		const job = await this.startCourseGenerationUseCase.execute({
			data: body,
			files: files ?? [],
			userId: user.id,
		});

		return {
			jobId: job.id,
			status: job.status,
			phase: job.phase,
			progress: job.progress,
		};
	}

	// 2. Rotas Específicas (COM ID)

	@Get('/:id/modules')
	@RequireAccess('course.read')
	async findModules(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload
	): Promise<ModuleResponseDto[]> {
		const modules = await this.fetchModules.execute(id, user.id);
		const entitlements = await this.getUserEntitlementsUseCase.execute(user.id);
		const isFreemiumScoped =
			!entitlements.hasActiveSubscription && entitlements.sampleConsumed;
		const visibleModules = isFreemiumScoped
			? modules.filter(
					(module) => module.id === entitlements.freemiumScope.firstModuleId
				)
			: modules;

		return visibleModules.map((module) => ModuleResponseDto.fromDomain(module));
	}

	@Put('/:id/provider-preferences')
	@RequireAccess('course.provider_preferences.update')
	async updateCourseProviderPreferences(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload,
		@Body() dto: UpdateProviderPreferencesDto
	): Promise<EffectiveProviderPreferencesResponseDto> {
		await this.updateProviderPreferencesUseCase.execute({
			userId: user.id,
			courseId: id,
			selection: {
				imageProvider: dto.imageProvider,
				audioProvider: dto.audioProvider,
				audioVoiceId: dto.audioVoiceId,
				videoProvider: dto.videoProvider,
				advancedSettings: dto.advancedSettings ?? {},
			},
		});

		const prefs = await this.getProviderPreferencesUseCase.execute({
			userId: user.id,
			courseId: id,
		});
		return EffectiveProviderPreferencesResponseDto.fromDomain(prefs);
	}

	@Post('/:id/export/scorm')
	@RequireAccess('course.export_scorm')
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

	// 3. Rotas Genéricas (CRUD) - Devem vir POR ÚLTIMO

	@Post()
	@RequireAccess('course.create_manual')
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
		const entitlements = await this.getUserEntitlementsUseCase.execute(user.id);
		const isFreemiumScoped =
			!entitlements.hasActiveSubscription && entitlements.sampleConsumed;
		const visibleCourses = isFreemiumScoped
			? courses.filter(
					(course) => course.id === entitlements.freemiumScope.sampleCourseId
				)
			: courses;
		return visibleCourses.map((course) =>
			CourseSummaryResponseDto.fromDomain(course)
		);
	}

	@Get('/:id')
	@RequireAccess('course.read')
	async findOne(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload
	): Promise<CourseResponseDto> {
		const course = await this.getCourse.execute({
			id,
			userId: user.id,
		});
		const entitlements = await this.getUserEntitlementsUseCase.execute(user.id);
		const dto = CourseResponseDto.fromDomain(course);
		return this.restrictCourseDtoForFreemium(dto, entitlements);
	}

	@Patch('/:id')
	@RequireAccess('course.update')
	async update(
		@Param('id') id: string,
		@Body() data: UpdateCourseDto,
		@CurrentUser() user: UserPayload
	): Promise<CourseResponseDto> {
		const course = await this.updateCourse.execute(id, data, user.id);
		return CourseResponseDto.fromDomain(course);
	}

	private restrictCourseDtoForFreemium(
		course: CourseResponseDto,
		entitlements: Awaited<ReturnType<GetUserEntitlementsUseCase['execute']>>
	): CourseResponseDto {
		const isFreemiumScoped =
			!entitlements.hasActiveSubscription && entitlements.sampleConsumed;
		if (!isFreemiumScoped) {
			return course;
		}

		const firstModuleId = entitlements.freemiumScope.firstModuleId;
		const firstLessonId = entitlements.freemiumScope.firstLessonId;
		if (!firstModuleId) {
			return { ...course, modules: [] };
		}

		const visibleModules = (course.modules ?? [])
			.filter((module) => module.id === firstModuleId)
			.map((module) => ({
				...module,
				lessons: (module.lessons ?? []).filter(
					(lesson) => lesson.id === firstLessonId
				),
			}));

		return { ...course, modules: visibleModules };
	}
}
