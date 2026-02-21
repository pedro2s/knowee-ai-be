import { ScormManifestBuilder } from './scorm-manifest.builder';

describe('ScormManifestBuilder', () => {
	it('deve gerar XML SCORM 1.2 com módulos e recursos por tipo de aula', () => {
		const builder = new ScormManifestBuilder();

		const xml = builder.build({
			id: 'course-1',
			title: 'Curso SCORM',
			description: 'Descrição',
			category: 'Tecnologia',
			level: 'Intermediário',
			duration: 'PT2H',
			targetAudience: 'Devs',
			objectives: 'Aprender SCORM',
			modules: [
				{
					id: 'module-1',
					title: 'Módulo 1',
					description: 'Desc módulo',
					orderIndex: 0,
					lessons: [
						{
							id: 'lesson-video',
							title: 'Vídeo',
							description: 'Desc vídeo',
							lessonType: 'video',
							duration: 10,
							content: {},
							resolvedMediaUrl: 'https://cdn.example/video.mp4',
							shouldUseVideoFallback: false,
						},
						{
							id: 'lesson-quiz',
							title: 'Quiz',
							description: 'Desc quiz',
							lessonType: 'quiz',
							duration: 5,
							content: {},
							resolvedMediaUrl: null,
							shouldUseVideoFallback: false,
						},
						{
							id: 'lesson-video-fallback',
							title: 'Vídeo sem final',
							description: 'Desc',
							lessonType: 'video',
							duration: 5,
							content: {},
							resolvedMediaUrl: null,
							shouldUseVideoFallback: true,
						},
					],
				},
			],
		});

		expect(xml).toContain('adlcp:scormtype="sco"');
		expect(xml).toContain('ADL SCORM');
		expect(xml).toContain('sco1_1/player.html?videoUrl=');
		expect(xml).toContain('sco1_2/quiz.html');
		expect(xml).toContain('sco1_3/index.html');
		expect(xml).toContain('RESOURCE-LESSON-lesson-video');
	});
});
