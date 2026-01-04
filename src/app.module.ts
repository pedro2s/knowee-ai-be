import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourseAuthoringModule } from './modules/course-authoring/course-authoring.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssistantModule } from './modules/assistant/assistant.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		CourseAuthoringModule,
		AssistantModule,
	],
})
export class AppModule {}
