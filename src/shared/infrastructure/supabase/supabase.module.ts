import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SUPABASE_SERVICE } from '../../application/ports/supabase.port';

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
