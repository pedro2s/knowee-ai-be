import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({ origin: '*' });
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // Remove propriedades que não estão no DTO (Segurança!)
			forbidNonWhitelisted: true, // Retorna erro se enviarem campos extras
			transform: true, // Transforma o payload em instância da classe DTO
		})
	);
	app.setGlobalPrefix('api');
	app.enableVersioning({
		type: VersioningType.URI,
		prefix: 'v',
		defaultVersion: '1',
	});

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
	console.error(err);
	process.exit(1);
});
