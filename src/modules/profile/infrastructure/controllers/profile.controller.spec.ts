import { ProfileController } from './profile.controller';
import type { GetProfileUseCase } from '../../application/use-cases/get-profile.usecase';
import type { UpdateProfileUseCase } from '../../application/use-cases/update-profile.usecase';

describe('ProfileController', () => {
	it('deve delegar getMe e updateMe', async () => {
		const getProfileUseCase = {
			execute: jest.fn().mockResolvedValue({ id: 'user-1' }),
		} as unknown as jest.Mocked<GetProfileUseCase>;
		const updateProfileUseCase = {
			execute: jest
				.fn()
				.mockResolvedValue({ id: 'user-1', fullName: 'Updated' }),
		} as unknown as jest.Mocked<UpdateProfileUseCase>;
		const controller = new ProfileController(
			getProfileUseCase,
			updateProfileUseCase
		);
		const user = {
			id: 'user-1',
			email: 'user@example.com',
			role: 'authenticated',
		} as never;

		await expect(controller.getMe(user)).resolves.toEqual({ id: 'user-1' });
		await expect(
			controller.updateMe(user, { fullName: 'Updated' })
		).resolves.toEqual({
			id: 'user-1',
			fullName: 'Updated',
		});

		expect(getProfileUseCase.execute).toHaveBeenCalledWith({
			id: 'user-1',
			email: 'user@example.com',
		});
		expect(updateProfileUseCase.execute).toHaveBeenCalledWith({
			user: {
				id: 'user-1',
				email: 'user@example.com',
			},
			dto: { fullName: 'Updated' },
		});
	});
});
