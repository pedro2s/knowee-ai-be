import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GetChatHistoryUseCase } from '../../application/use-cases/get-chat-history.usecase';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { ChatHistoryResponseDto } from '../../application/dtos/chat-history.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { SubmitQuestionUseCase } from '../../application/use-cases/submit-question.usecase';
import { SubmitQuestionDto } from '../../application/dtos/submit-question.dto';
import { QuestionAnsweredResponseDto } from '../../application/dtos/question-answered.response.dto';
import { GenerateTextDto } from '../../application/dtos/generate-text.dto';
import { GeneratedTextResponseDto } from '../../application/dtos/generated-text.response.dto';
import { GenerateTextUseCase } from '../../application/use-cases/generate-text.usecase';

@Controller('assistant')
@UseGuards(SupabaseAuthGuard)
export class AssistantController {
	constructor(
		private readonly getChatHistory: GetChatHistoryUseCase,
		private readonly submitQuestion: SubmitQuestionUseCase,
		private readonly generateTextUseCase: GenerateTextUseCase
	) {}

	@Get('chat/:courseId')
	async getChatHistoryByCourseId(
		@Param('courseId') courseId: string,
		@CurrentUser() user: UserPayload
	): Promise<ChatHistoryResponseDto[]> {
		const chatHistory = await this.getChatHistory.execute({
			courseId,
			userId: user.id,
		});
		return chatHistory.map((history) =>
			ChatHistoryResponseDto.fromDomain(history)
		);
	}

	@Post('chat')
	async question(
		@Body() body: SubmitQuestionDto,
		@CurrentUser() user: UserPayload
	): Promise<QuestionAnsweredResponseDto> {
		const questionAnswered = await this.submitQuestion.execute(body, user.id);

		return { answer: questionAnswered.answer };
	}

	@Post('/generate-text')
	async generateText(
		@Body() data: GenerateTextDto,
		@CurrentUser() user: UserPayload
	): Promise<GeneratedTextResponseDto> {
		const generatedText = await this.generateTextUseCase.execute(data, user.id);
		return GeneratedTextResponseDto.fromDomain(generatedText);
	}
}
