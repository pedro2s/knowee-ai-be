import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/create-corse.usecase';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { Request } from 'express';
import { FetchCoursesUseCase } from '../../application/use-cases/fetch-courses.usecase';
import { CourseResponseDto } from '../../application/dtos/course.response.dto';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';

interface RequestWithUser extends Request {
	user: {
		id: string;
		email: string;
	};
}

@Controller('courses')
@UseGuards(SupabaseAuthGuard)
export class CoursesController {
	constructor(
		private readonly createCourse: CreateCourseUseCase,
		private readonly fetchCourses: FetchCoursesUseCase,
	) {}

	@Get()
	async findAll(@Req() req: RequestWithUser) {
		return this.fetchCourses.execute(req.user.id);
	}

	@Post()
	async create(
		@Req() req: RequestWithUser,
		@Body() body: CreateCourseDto,
	): Promise<CourseResponseDto> {
		// 1. Chama o Caso de Uso passando os dados validos
		const courseEntity = await this.createCourse.execute({
			...(body as any),
			userId: req.user.id,
			model: body.ai?.model,
		});

		// 2. Converte a Entidade de Domínio para o Contrato da API (Response DTO)
		return CourseResponseDto.fromDomain(courseEntity);
	}
}
