import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { StreamableFile } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import type { GenerateCourseUseCase } from '../../application/use-cases/generate-course.usecase';
import type { StartCourseGenerationUseCase } from '../../application/use-cases/start-course-generation.usecase';
import type { FetchCoursesUseCase } from '../../application/use-cases/fetch-courses.usecase';
import type { GetCourseUseCase } from '../../application/use-cases/get-course.usecase';
import type { FetchModulesUseCase } from '../../application/use-cases/fetch-modules.usecase';
import type { UpdateCourseWithModuleTreeUseCase } from '../../application/use-cases/update-course-with-module-tree.usecase';
import type { ExportCourseScormUseCase } from '../../application/use-cases/export-course-scorm.usecase';
import type { UpdateProviderPreferencesUseCase } from 'src/modules/provider-preferences/application/use-cases/update-provider-preferences.usecase';
import type { GetProviderPreferencesUseCase } from 'src/modules/provider-preferences/application/use-cases/get-provider-preferences.usecase';
import type { Response } from 'express';

describe('CoursesController', () => {
	it('deve configurar headers e retornar stream no endpoint export/scorm', async () => {
		const tempDir = await fs.mkdtemp(
			path.join(os.tmpdir(), 'courses-controller-')
		);
		const zipPath = path.join(tempDir, 'curso.zip');
		await fs.writeFile(zipPath, Buffer.from('fake-zip-content'));

		const cleanup = jest.fn(async () => {
			await fs.rm(tempDir, { recursive: true, force: true });
		});
		const exportScormExecuteMock = jest.fn().mockResolvedValue({
			zipPath,
			fileName: 'curso.zip',
			cleanup,
		});

		const controller = new CoursesController(
			{ execute: jest.fn() } as unknown as GenerateCourseUseCase,
			{ execute: jest.fn() } as unknown as StartCourseGenerationUseCase,
			{ execute: jest.fn() } as unknown as UpdateProviderPreferencesUseCase,
			{ execute: jest.fn() } as unknown as GetProviderPreferencesUseCase,
			{ execute: jest.fn() } as unknown as FetchCoursesUseCase,
			{ execute: jest.fn() } as unknown as GetCourseUseCase,
			{ execute: jest.fn() } as unknown as FetchModulesUseCase,
			{ execute: jest.fn() } as unknown as UpdateCourseWithModuleTreeUseCase,
			{ execute: exportScormExecuteMock } as unknown as ExportCourseScormUseCase
		);

		const callbacks = new Map<string, () => void>();
		const setHeaderMock = jest.fn();
		const onMock = jest.fn((event: string, callback: () => void) => {
			callbacks.set(event, callback);
			return response;
		});
		const response = {
			setHeader: setHeaderMock,
			on: onMock,
		} as unknown as Response;

		const result = await controller.exportScorm(
			'9ef13d89-8f89-4b93-aef5-8857756df453',
			{ exportFormat: 'scorm' },
			{ id: 'user-1' } as never,
			response
		);

		expect(exportScormExecuteMock).toHaveBeenCalledWith(
			'9ef13d89-8f89-4b93-aef5-8857756df453',
			'user-1',
			{ exportFormat: 'scorm' }
		);
		expect(setHeaderMock).toHaveBeenCalledWith(
			'Content-Type',
			'application/zip'
		);
		expect(setHeaderMock).toHaveBeenCalledWith(
			'Content-Disposition',
			'attachment; filename="curso.zip"'
		);
		expect(result).toBeInstanceOf(StreamableFile);

		callbacks.get('finish')?.();
		await Promise.resolve();
		expect(cleanup).toHaveBeenCalledTimes(1);

		callbacks.get('close')?.();
		await Promise.resolve();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});
});
