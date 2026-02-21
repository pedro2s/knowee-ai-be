import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
	@IsOptional()
	@IsString()
	fullName?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	company?: string;

	@IsOptional()
	@IsString()
	bio?: string;

	@IsOptional()
	@IsString()
	avatarUrl?: string;
}
