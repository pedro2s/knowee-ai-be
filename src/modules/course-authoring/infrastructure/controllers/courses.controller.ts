import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/create-corse.usecase';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
	user: {
		sub: string;
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
export class CoursesController {
	constructor(private readonly createCourse: CreateCourseUseCase) {}

	@Post()
	@UseGuards(SupabaseAuthGuard)
	async create(@Req() req: RequestWithUser, @Body() body: CreateCourseBody) {
		return this.createCourse.execute({
			...body,
			userId: req.user.sub,
			model: body.ai?.model,
		});
	}
}
