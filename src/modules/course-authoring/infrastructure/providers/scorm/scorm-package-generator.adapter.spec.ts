import fs from 'fs/promises';
import JSZip from 'jszip';
import { ScormManifestBuilder } from './scorm-manifest.builder';
import { ScormPackageGeneratorAdapter } from './scorm-package-generator.adapter';
import type { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

describe('ScormPackageGeneratorAdapter', () => {
	it('deve gerar zip SCORM com artefatos esperados e executar cleanup', async () => {
		const downloadMock = jest
			.fn()
			.mockResolvedValue(Buffer.from('%PDF-1.4 fake'));
		const storage = {
			download: downloadMock,
		} as unknown as StoragePort;
		const adapter = new ScormPackageGeneratorAdapter(
			new ScormManifestBuilder(),
			storage
		);

		const result = await adapter.generate({
			id: 'course-1',
			title: 'Curso de Exportação',
			description: 'Descrição',
			category: 'Categoria',
			level: 'Nível',
			duration: 'PT1H',
			targetAudience: 'Todos',
			objectives: 'Objetivos',
			modules: [
				{
					id: 'module-1',
					title: 'Módulo 1',
					description: 'Desc módulo',
					orderIndex: 0,
					lessons: [
						{
							id: 'lesson-fallback',
							title: 'Aula vídeo',
							description: 'Desc aula',
							lessonType: 'video',
							duration: 100,
							content: {},
							mediaSourcePath: null,
							shouldUseVideoFallback: true,
						},
						{
							id: 'lesson-quiz',
							title: 'Quiz',
							description: 'Desc quiz',
							lessonType: 'quiz',
							duration: 20,
							content: {
								quizQuestions: [
									{
										id: 'q1',
										question: 'Pergunta?',
										options: ['A', 'B', 'C', 'D'],
										correctAnswer: 0,
										explanation: 'Explicação',
									},
								],
							},
							mediaSourcePath: null,
							shouldUseVideoFallback: false,
						},
						{
							id: 'lesson-pdf',
							title: 'PDF',
							description: 'Desc pdf',
							lessonType: 'pdf',
							duration: 15,
							content: {},
							mediaSourcePath: 'user-1/course-1/handout.pdf',
							shouldUseVideoFallback: false,
						},
					],
				},
			],
		});

		const zipFile = await fs.readFile(result.zipPath);
		const zip = await JSZip.loadAsync(zipFile);
		const files = Object.keys(zip.files);

		expect(zipFile.length).toBeGreaterThan(0);
		expect(files).toEqual(
			expect.arrayContaining([
				'imsmanifest.xml',
				'sco1_1/index.html',
				'sco1_1/scorm_api_wrapper.js',
				'sco1_2/quiz.html',
				'sco1_2/quiz.js',
				'sco1_2/scormdriver.js',
				'sco1_3/index.html',
				'sco1_3/document.pdf',
			])
		);
		await expect(
			zip.file('imsmanifest.xml')?.async('string')
		).resolves.toContain('<manifest');
		await expect(
			zip.file('sco1_3/document.pdf')?.async('nodebuffer')
		).resolves.toEqual(Buffer.from('%PDF-1.4 fake'));
		expect(downloadMock).toHaveBeenCalledWith({
			bucket: 'lesson-assets',
			path: 'user-1/course-1/handout.pdf',
		});

		await result.cleanup();
		await expect(fs.access(result.zipPath)).rejects.toBeDefined();
	});
});
