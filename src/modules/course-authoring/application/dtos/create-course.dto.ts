import {
	IsArray,
	IsBoolean,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from '../../../../shared/application/dtos/ai-provider.dto';
import { Expose, Transform, Type } from 'class-transformer';

export class CreateCourseDto {
	// Dados básicos do curso
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
	@Expose({ name: 'target_audience' })
	readonly targetAudience?: string;

	@IsOptional()
	@IsString({ message: 'Os objetivos devem ser uma string' })
	readonly objectives?: string;

	// Dados personalizados baseados no nível
	@IsOptional()
	@IsString({ message: 'O objetivo principal deve ser uma string' })
	@Expose({ name: 'main_goal' })
	readonly mainGoal?: string;

	@IsOptional()
	@IsString({ message: 'Os tópicos essenciais devem ser uma string' })
	@Expose({ name: 'essential_topics' })
	readonly essentialTopics?: string;

	@IsOptional()
	@IsString({ message: 'Os casos de exemplo devem ser uma string' })
	@Expose({ name: 'examples_cases' })
	readonly examplesCases?: string;

	@IsOptional()
	@IsString({ message: 'O tipo do curso deve ser uma string' })
	@Expose({ name: 'course_type' })
	readonly courseType?: string;

	@IsOptional()
	@IsBoolean({ message: 'includeAssessments deve ser um booleano' })
	@Expose({ name: 'include_assessments' })
	@Transform(({ value }) => value === 'true')
	readonly includeAssessments: boolean;

	@IsOptional()
	@IsBoolean({ message: 'includeProjects deve ser um booleano' })
	@Expose({ name: 'include_projects' })
	@Transform(({ value }) => value === 'true')
	readonly includeProjects: boolean;

	// perfil do instrutor
	@IsString({ message: 'O nome do instrutor deve ser uma string' })
	@Expose({ name: 'instructor_name' })
	readonly instructorName: string;

	@IsOptional()
	@IsString({ message: 'O nível do instrutor deve ser uma string' })
	@Expose({ name: 'instructor_level' })
	readonly instructorLevel?: string;

	@IsOptional()
	@IsString({ message: 'A área do instrutor deve ser uma string' })
	@Expose({ name: 'instructor_area' })
	readonly instructorArea?: string;

	@IsOptional()
	@IsString({ message: 'A experiência do instrutor deve ser uma string' })
	@Expose({ name: 'teaching_experience' })
	readonly teachingExperience?: string;

	@IsOptional()
	@IsString({ message: 'As conquistas do instrutor devem ser uma string' })
	@Expose({ name: 'instructor_achievements' })
	readonly instructorAchievements?: string;

	@IsOptional()
	@IsString({ message: 'O público típico deve ser uma string' })
	@Expose({ name: 'typical_audience' })
	readonly typicalAudience?: string;

	@IsOptional()
	@IsString({ message: 'A motivação do instrutor deve ser uma string' })
	@Expose({ name: 'instructor_motivation' })
	readonly instructorMotivation?: string;

	@IsOptional()
	@IsArray({
		message: 'Os formatos preferidos devem ser um array de strings',
	})
	@Expose({ name: 'preferred_formats' })
	@Transform(({ value }) => JSON.parse(value) as string[])
	readonly preferredFormats?: string[];

	// Dados de IA
	@IsOptional()
	@Type(() => AIProviderDto)
	@ValidateNested()
	readonly ai?: AIProviderDto;
}
