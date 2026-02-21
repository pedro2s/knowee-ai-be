import { Module } from '@nestjs/common';
import { SupabaseService } from './infrastructure/supabase.service';
import { SUPABASE_SERVICE } from './domain/ports/supabase.port';

@Module({
	providers: [
		{
			provide: SUPABASE_SERVICE,
			useClass: SupabaseService,
		},
	],
	exports: [SUPABASE_SERVICE],
})
export class SupabaseModule {}
