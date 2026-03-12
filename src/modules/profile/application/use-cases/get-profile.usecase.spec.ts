import { GetProfileUseCase } from './get-profile.usecase';
import type { ProfileRepositoryPort } from '../../domain/ports/profile-repository.port';

describe('GetProfileUseCase', () => {
	it('deve retornar o perfil existente', async () => {
		const profileRepository = {
			findById: jest.fn().mockResolvedValue({
				id: 'user-1',
				email: 'user@example.com',
				fullName: 'User',
				phone: null,
				company: null,
				bio: null,
				avatarUrl: null,
			}),
			upsert: jest.fn(),
		} as unknown as jest.Mocked<ProfileRepositoryPort>;

		const useCase = new GetProfileUseCase(profileRepository);

		await expect(
			useCase.execute({ id: 'user-1', email: 'user@example.com' })
		).resolves.toEqual({
			id: 'user-1',
			email: 'user@example.com',
			fullName: 'User',
			phone: null,
			company: null,
			bio: null,
			avatarUrl: null,
		});
		expect(profileRepository.upsert).not.toHaveBeenCalled();
	});

	it('deve criar o perfil quando ele nao existir', async () => {
		const profileRepository = {
			findById: jest.fn().mockResolvedValue(null),
			upsert: jest.fn().mockResolvedValue({
				id: 'user-1',
				email: 'user@example.com',
				fullName: null,
				phone: null,
				company: null,
				bio: null,
				avatarUrl: null,
			}),
		} as unknown as jest.Mocked<ProfileRepositoryPort>;

		const useCase = new GetProfileUseCase(profileRepository);

		await useCase.execute({ id: 'user-1', email: 'user@example.com' });

		expect(profileRepository.upsert).toHaveBeenCalledWith({
			id: 'user-1',
			email: 'user@example.com',
		});
	});
});
