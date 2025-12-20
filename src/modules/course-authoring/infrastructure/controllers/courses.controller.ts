import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/create-corse.usecase';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { FetchCoursesUseCase } from '../../application/use-cases/fetch-courses.usecase';
import { CourseResponseDto } from '../../application/dtos/course.response.dto';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/types/user.types';
import { CourseSummaryResponseDto } from '../../application/dtos/course-summary.response.dto';

@Controller('courses')
@UseGuards(SupabaseAuthGuard)
export class CoursesController {
	constructor(
		private readonly createCourse: CreateCourseUseCase,
		private readonly fetchCourses: FetchCoursesUseCase,
	) {}

	@Get()
	async findAll(
		@CurrentUser() user: UserPayload,
	): Promise<CourseSummaryResponseDto[]> {
		const courses = await this.fetchCourses.execute(user.id);
		return courses.map(CourseSummaryResponseDto.fromDomain);
	}

	@Post()
	async create(
		@Body() body: CreateCourseDto,
		@CurrentUser() user: UserPayload,
	): Promise<CourseResponseDto> {
		// 1. Chama o Caso de Uso passando os dados validos
		const courseEntity = await this.createCourse.execute({
			...(body as any),
			userId: user.id,
			model: body.ai?.model,
		});

		// 2. Converte a Entidade de Domínio para o Contrato da API (Response DTO)
		return CourseResponseDto.fromDomain(courseEntity);
	}
}
