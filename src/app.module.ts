import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourseAuthoringModule } from './modules/course-authoring/course-authoring.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { BillingModule } from './modules/billing/billing.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ProviderPreferencesModule } from './modules/provider-preferences/provider-preferences.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { LegalModule } from './modules/legal/legal.module';
import { QueueModule } from './shared/queue/queue.module';
import { AppController } from './app.controller';

@Module({
	controllers: [AppController],
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		QueueModule,
		AuthModule,
		CourseAuthoringModule,
		AssistantModule,
		BillingModule,
		ProfileModule,
		ProviderPreferencesModule,
		AccessControlModule,
		LegalModule,
	],
})
export class AppModule {}
