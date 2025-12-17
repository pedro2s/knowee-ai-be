import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourseAuthoringModule } from './modules/course-authoring/course-authoring.module';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SupabaseModule } from './shared/supabase/supabase.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		CourseAuthoringModule,
		AuthModule,
		SupabaseModule,
	],
})
export class AppModule {}
