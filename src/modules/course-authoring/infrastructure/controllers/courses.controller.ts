import { Body, Controller, Post, Req } from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/create-corse.usecase';

@Controller('courses')
export class CoursesController {
	constructor(private readonly createCourse: CreateCourseUseCase) {}

	@Post()
	async create(@Req() req, @Body() body) {
		return this.createCourse.execute({
			...body,
			userId: req.user.sub,
			model: body.ai?.model,
		});
	}
}
