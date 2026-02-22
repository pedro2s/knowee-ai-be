import { Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from './subapase.constants';

@Module({
	providers: [
		{
			provide: SUPABASE_CLIENT,
			useFactory: (configService: ConfigService) =>
				createClient<any, 'public'>(
					configService.getOrThrow<string>('SUPABASE_URL'),
					configService.getOrThrow<string>('SUPABASE_SECRET_KEY')
				),
			inject: [ConfigService],
		},
	],
	exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
