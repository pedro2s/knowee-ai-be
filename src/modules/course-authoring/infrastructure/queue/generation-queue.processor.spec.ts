import { Job } from 'bullmq';
import { GenerationQueueProcessor } from './generation-queue.processor';
import { GENERATION_JOB_NAMES } from 'src/shared/queue/queue.constants';

describe('GenerationQueueProcessor', () => {
	const buildJob = (
		overrides: Partial<Job<{ jobId: string; userId: string }>> = {}
	) =>
		({
			id: 'queue-job-1',
			name: GENERATION_JOB_NAMES.COURSE_GENERATE,
			attemptsMade: 0,
			data: {
				jobId: 'job-1',
				userId: 'user-1',
			},
			...overrides,
		}) as Job<{ jobId: string; userId: string }>;

	const createProcessor = () => {
		const payloadRepository = {
			findByJobId: jest.fn(),
			deleteByJobId: jest.fn(),
		};
		const generationJobRepository = {
			update: jest.fn(),
			findById: jest.fn(),
		};
		const courseOrchestrator = {
			run: jest.fn(),
		};
		const assetsOrchestrator = {
			run: jest.fn(),
		};
		const generateLessonAudioUseCase = {
			execute: jest.fn(),
		};
		const generateSectionVideoUseCase = {
			execute: jest.fn(),
		};
		const mergeLessonSectionsVideoUseCase = {
			execute: jest.fn(),
		};
		const generationEventsService = {
			publish: jest.fn(),
		};

		const processor = new GenerationQueueProcessor(
			payloadRepository as any,
			generationJobRepository as any,
			courseOrchestrator as any,
			assetsOrchestrator as any,
			generateLessonAudioUseCase as any,
			generateSectionVideoUseCase as any,
			mergeLessonSectionsVideoUseCase as any,
			generationEventsService as any
		);

		return {
			processor,
			payloadRepository,
			generationJobRepository,
			courseOrchestrator,
			assetsOrchestrator,
			generateLessonAudioUseCase,
			generateSectionVideoUseCase,
			mergeLessonSectionsVideoUseCase,
			generationEventsService,
		};
	};

	it('fails early in onActive when job userId is missing', async () => {
		const { processor, generationJobRepository } = createProcessor();
		const job = buildJob({
			data: {
				jobId: 'job-legacy',
				userId: '',
			},
		});

		await expect(processor.onActive(job)).rejects.toThrow(
			'Invalid generation queue job: userId is required'
		);
		expect(generationJobRepository.update).not.toHaveBeenCalled();
	});

	it('fails early in process when job userId is missing', async () => {
		const { processor, payloadRepository, generationJobRepository } =
			createProcessor();
		const job = buildJob({
			data: {
				jobId: 'job-legacy',
				userId: '',
			},
		});

		await expect(processor.process(job)).rejects.toThrow(
			'Invalid generation queue job: userId is required'
		);
		expect(payloadRepository.findByJobId).not.toHaveBeenCalled();
		expect(generationJobRepository.update).not.toHaveBeenCalled();
	});

	it('continues processing normally when userId is valid', async () => {
		const {
			processor,
			payloadRepository,
			generationJobRepository,
			courseOrchestrator,
		} = createProcessor();
		const job = buildJob();

		payloadRepository.findByJobId.mockResolvedValue({
			type: 'course_generation',
			data: {
				title: 'Curso teste',
			},
			files: [],
		});
		generationJobRepository.update.mockResolvedValue({});
		courseOrchestrator.run.mockResolvedValue(undefined);
		payloadRepository.deleteByJobId.mockResolvedValue(undefined);

		await expect(processor.process(job)).resolves.toBeUndefined();

		expect(payloadRepository.findByJobId).toHaveBeenCalledWith('job-1', {
			userId: 'user-1',
			role: 'authenticated',
		});
		expect(generationJobRepository.update).toHaveBeenCalledWith(
			'job-1',
			expect.objectContaining({
				attempts: 0,
				queueJobId: 'queue-job-1',
			}),
			{
				userId: 'user-1',
				role: 'authenticated',
			}
		);
		expect(courseOrchestrator.run).toHaveBeenCalledWith({
			jobId: 'job-1',
			userId: 'user-1',
			data: {
				title: 'Curso teste',
			},
			files: [],
		});
	});
});
