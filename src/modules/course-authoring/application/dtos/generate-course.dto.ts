import {
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from 'src/shared/application/dtos/ai-provider.dto';
import { Expose, Type } from 'class-transformer';

export class GenerateCourseDto {
	// Dados básicos do curso
	@IsString({ message: 'O título deve ser uma string' })
	@MinLength(5, { message: 'O título é muito curto (mínimo 5 caracteres)' })
	@MaxLength(255, {
		message: 'O título é muito longo (máximo 255 caracteres)',
	})
	readonly title: string;

	@IsString({ message: 'A descrição deve ser uma string' })
	readonly description: string;

	@IsOptional()
	@IsString({ message: 'A categoria deve ser uma string' })
	readonly category?: string;

	@IsOptional()
	@IsString({ message: 'O nível deve ser uma string' })
	readonly level?: string;

	@IsOptional()
	@IsString({ message: 'A duração deve ser uma string' })
	readonly duration?: string;

	@IsOptional()
	@IsString({ message: 'O público alvo deve ser uma string' })
	@Expose({ name: 'targetAudience' })
	readonly targetAudience?: string;

	// perfil do instrutor
	@IsOptional()
	@IsString({ message: 'O nome do instrutor deve ser uma string' })
	@Expose({ name: 'instructorName' })
	readonly instructorName?: string;

	// Dados de IA
	@IsOptional()
	@Type(() => AIProviderDto)
	@ValidateNested()
	readonly ai?: AIProviderDto;
}
