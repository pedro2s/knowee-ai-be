import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
	private supabase: SupabaseClient;

	constructor(private readonly configService: ConfigService) {
		const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
		const supabaseKey = this.configService.get<string>(
			'SUPABASE_SECRET_KEY',
		);

		if (!supabaseUrl || !supabaseKey) {
			throw new Error('Supabase URL and Key must be provided.');
		}

		this.supabase = createClient<any, 'public'>(supabaseUrl, supabaseKey);
	}

	getClient() {
		return this.supabase;
	}
}
