import { UpdateProfileUseCase } from './update-profile.usecase';
import type { ProfileRepositoryPort } from '../../domain/ports/profile-repository.port';

describe('UpdateProfileUseCase', () => {
	it('deve persistir atualizacoes e mapear para ProfileResponseDto', async () => {
		const profileRepository = {
			upsert: jest.fn().mockResolvedValue({
				id: 'user-1',
				email: 'user@example.com',
				fullName: 'Updated User',
				phone: '+55 11 99999-9999',
				company: 'Knowee',
				bio: 'Bio',
				avatarUrl: 'https://cdn.test/avatar.png',
			}),
		} as unknown as jest.Mocked<ProfileRepositoryPort>;

		const useCase = new UpdateProfileUseCase(profileRepository);

		await expect(
			useCase.execute({
				user: { id: 'user-1', email: 'user@example.com' },
				dto: {
					fullName: 'Updated User',
					phone: '+55 11 99999-9999',
					company: 'Knowee',
					bio: 'Bio',
					avatarUrl: 'https://cdn.test/avatar.png',
				},
			})
		).resolves.toEqual({
			id: 'user-1',
			email: 'user@example.com',
			fullName: 'Updated User',
			phone: '+55 11 99999-9999',
			company: 'Knowee',
			bio: 'Bio',
			avatarUrl: 'https://cdn.test/avatar.png',
		});
	});
});
