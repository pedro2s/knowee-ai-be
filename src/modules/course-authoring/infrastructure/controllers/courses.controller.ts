import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/create-corse.usecase';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { Request } from 'express';
import { FetchCoursesUseCase } from '../../application/use-cases/fetch-courses.usecase';

interface RequestWithUser extends Request {
	user: {
		id: string;
		email: string;
	};
}

interface CreateCourseBody {
	title: string;
	ai?: {
		model?: string;
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
	async create(@Req() req: RequestWithUser, @Body() body: CreateCourseBody) {
		return this.createCourse.execute({
			...(body as any),
			userId: req.user.id,
			model: body.ai?.model,
		});
	}
}
