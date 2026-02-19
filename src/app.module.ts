import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourseAuthoringModule } from './modules/course-authoring/course-authoring.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		CourseAuthoringModule,
		AssistantModule,
		BillingModule,
	],
})
export class AppModule {}
