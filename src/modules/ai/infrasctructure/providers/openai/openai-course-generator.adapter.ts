import { Injectable } from '@nestjs/common';
import { CourseGeneratorPort } from 'src/modules/course-authoring/domain/ports/course-generator.port';
import {
	CreateCourseInput,
	GeneratedCourse,
} from 'src/modules/course-authoring/domain/entities/course.types';
import { buildCoursePrompt, courseStructure } from './openai.prompts';
import OpenAI from 'openai';

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseGeneratorPort {
	private openai: OpenAI;

	constructor() {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	async generate(input: CreateCourseInput): Promise<GeneratedCourse> {
		const completion = await this.openai.chat.completions.create({
			model: input.model ?? 'gpt-4.1',
			messages: buildCoursePrompt(input),
			response_format: courseStructure,
		});

		const content = completion.choices[0].message.content;
		if (!content) {
			throw new Error('OpenAI API did not return any content.');
		}

		return JSON.parse(content);
	}
}
