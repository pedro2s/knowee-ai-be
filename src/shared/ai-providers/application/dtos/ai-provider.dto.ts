import { IsOptional, IsString } from 'class-validator';

export class AIProviderDto {
	@IsOptional()
	@IsString({ message: 'O provedor deve ser uma string' })
	readonly provider?: string;
}
