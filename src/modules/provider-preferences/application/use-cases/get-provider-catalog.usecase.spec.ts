import { GetProviderCatalogUseCase } from './get-provider-catalog.usecase';
import type { ProviderCatalogService } from '../services/provider-catalog.service';

describe('GetProviderCatalogUseCase', () => {
	it('deve retornar o catalogo do service', () => {
		const catalog = {
			image: [{ id: 'openai' }],
			audio: [{ id: 'openai' }],
			video: [{ id: 'openai' }],
		};
		const providerCatalogService = {
			getCatalog: jest.fn().mockReturnValue(catalog),
		} as unknown as jest.Mocked<ProviderCatalogService>;

		const useCase = new GetProviderCatalogUseCase(providerCatalogService);

		expect(useCase.execute()).toBe(catalog);
	});
});
