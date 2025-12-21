import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GetChatHistoryUseCase } from '../../application/use-cases/get-chat-history.usecase';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/types/user.types';
import { ChatHistoryResponseDto } from '../../application/dtos/chat-history.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';

@Controller('assistant')
@UseGuards(SupabaseAuthGuard)
export class AssistantController {
	constructor(private readonly getChatHistory: GetChatHistoryUseCase) {}

	@Get('chat/:courseId')
	async getChatHistoryByCourseId(
		@Param('courseId') courseId: string,
		@CurrentUser() user: UserPayload,
	): Promise<ChatHistoryResponseDto[]> {
		const chatHistory = await this.getChatHistory.execute({
			courseId,
			userId: user.id,
		});
		return chatHistory.map(ChatHistoryResponseDto.fromDomain);
	}
}
