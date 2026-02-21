import {
	IsBoolean,
	IsObject,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExportedSectionsDto {
	@IsOptional()
	@IsBoolean()
	header?: boolean;

	@IsOptional()
	@IsBoolean()
	description?: boolean;

	@IsOptional()
	@IsBoolean()
	objectives?: boolean;

	@IsOptional()
	@IsBoolean()
	modules?: boolean;

	@IsOptional()
	@IsBoolean()
	resources?: boolean;
}

export class ExportScormDto {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => ExportedSectionsDto)
	exportedSections?: ExportedSectionsDto;

	@IsOptional()
	@IsString()
	exportFormat?: string;
}
