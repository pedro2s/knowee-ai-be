import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const logger = new Logger('WorkerBootstrap');
	logger.log('Queue worker started.');

	const shutdown = async () => {
		logger.log('Queue worker shutting down.');
		await app.close();
		process.exit(0);
	};

	process.on('SIGTERM', () => {
		void shutdown();
	});
	process.on('SIGINT', () => {
		void shutdown();
	});
}

bootstrap().catch((err) => {
	console.error(err);
	process.exit(1);
});
