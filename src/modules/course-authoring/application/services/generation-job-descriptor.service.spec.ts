import { GenerationJobDescriptorService } from './generation-job-descriptor.service';

describe('GenerationJobDescriptorService', () => {
	it('builds a course generation label from the course title', () => {
		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'course_generation',
			courseId: 'course-1',
			targetLabel: 'Curso de Lideranca',
		});

		expect(descriptor).toMatchObject({
			jobFamily: 'course',
			jobIntent: 'Gerando curso',
			dedupeKey: 'course:course-1:generation',
			targetLabel: 'Curso de Lideranca',
		});
	});

	it('builds an asset batch label with lesson count when provided', () => {
		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'assets_generation',
			courseId: 'course-1',
			selectedLessonIds: ['lesson-2', 'lesson-1'],
		});

		expect(descriptor).toMatchObject({
			jobFamily: 'asset_batch',
			jobIntent: 'Gerando assets',
			dedupeKey: 'course:course-1:assets:lesson-1,lesson-2',
			targetLabel: '2 aula(s) selecionada(s)',
		});
	});

	it('builds a lesson audio label scoped to the lesson title', () => {
		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_audio_generation',
			lessonId: 'lesson-1',
			targetLabel: 'Aula de Vendas',
		});

		expect(descriptor).toMatchObject({
			jobFamily: 'lesson_audio',
			targetLabel: 'Aula de Vendas • audio',
			dedupeKey: 'lesson:lesson-1:audio',
		});
	});

	it('builds a lesson merge label scoped to the lesson title', () => {
		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_merge_video_generation',
			lessonId: 'lesson-1',
			targetLabel: 'Aula de Vendas',
		});

		expect(descriptor).toMatchObject({
			jobFamily: 'lesson_merge_video',
			targetLabel: 'Aula de Vendas • video final',
			dedupeKey: 'lesson:lesson-1:merge-video',
		});
	});

	it('builds distinct labels for two section video jobs in the same lesson', () => {
		const firstDescriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_section_video_generation',
			lessonId: 'lesson-1',
			sectionId: 'section-abc12345',
			targetLabel: 'Aula de Vendas',
			sectionLabel: 'Introducao',
		});
		const secondDescriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_section_video_generation',
			lessonId: 'lesson-1',
			sectionId: 'section-def67890',
			targetLabel: 'Aula de Vendas',
			sectionLabel: 'Fechamento',
		});

		expect(firstDescriptor.targetLabel).toBe('Aula de Vendas • Introducao');
		expect(secondDescriptor.targetLabel).toBe('Aula de Vendas • Fechamento');
		expect(firstDescriptor.targetLabel).not.toBe(secondDescriptor.targetLabel);
	});

	it('falls back to a shortened section id when section label is missing', () => {
		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_section_video_generation',
			lessonId: 'lesson-1',
			sectionId: 'section-abc12345',
			targetLabel: 'Aula de Vendas',
		});

		expect(descriptor).toMatchObject({
			targetLabel: 'Aula de Vendas • secao section-',
			dedupeKey: 'lesson:lesson-1:section:section-abc12345:video',
		});
	});
});
