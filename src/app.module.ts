import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from './modules/ai/ai.module';
import { CourseAuthoringModule } from './modules/course-authoring/course-authoring.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		AIModule,
		CourseAuthoringModule,
	],
})
export class AppModule {}
