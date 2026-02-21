import fs from 'fs/promises';
import { ScormManifestBuilder } from './scorm-manifest.builder';
import { ScormPackageGeneratorAdapter } from './scorm-package-generator.adapter';

describe('ScormPackageGeneratorAdapter', () => {
	it('deve gerar zip SCORM com artefatos esperados e executar cleanup', async () => {
		const adapter = new ScormPackageGeneratorAdapter(
			new ScormManifestBuilder()
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
							resolvedMediaUrl: null,
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
							resolvedMediaUrl: null,
							shouldUseVideoFallback: false,
						},
					],
				},
			],
		});

		const zipFile = await fs.readFile(result.zipPath);
		expect(zipFile.length).toBeGreaterThan(0);
		expect(zipFile.includes(Buffer.from('imsmanifest.xml'))).toBe(true);
		expect(zipFile.includes(Buffer.from('sco1_1/index.html'))).toBe(true);
		expect(zipFile.includes(Buffer.from('sco1_2/quiz.html'))).toBe(true);
		expect(zipFile.includes(Buffer.from('sco1_2/quiz.js'))).toBe(true);

		await result.cleanup();
		await expect(fs.access(result.zipPath)).rejects.toBeDefined();
	});
});
