import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
	@IsString({ message: 'O título deve ser uma string' })
	@MinLength(5, { message: 'O título é muito curto (mínimo 5 caracteres)' })
	@MaxLength(100, {
		message: 'O título é muito longo (máximo 100 caracteres)',
	})
	readonly title: string;

	@IsOptional()
	@IsString({ message: 'A descrição deve ser uma string' })
	readonly description?: string;

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
	readonly targetAudience?: string;

	@IsOptional()
	@IsString({ message: 'Os objetivos devem ser uma string' })
	readonly ai?: {
		model: string;
	};
}
