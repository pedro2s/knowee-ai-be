import {
	ArrayMinSize,
	IsArray,
	IsInt,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderLessonItemDto {
	@IsUUID()
	id!: string;

	@IsInt()
	orderIndex!: number;
}

export class ReorderLessonsDto {
	@IsUUID()
	moduleId!: string;

	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => ReorderLessonItemDto)
	items!: ReorderLessonItemDto[];
}
