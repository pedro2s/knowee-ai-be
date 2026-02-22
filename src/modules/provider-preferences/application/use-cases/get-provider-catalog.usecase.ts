import { Injectable } from '@nestjs/common';
import { ProviderCatalogService } from '../services/provider-catalog.service';
import { ProviderCatalog } from '../../domain/entities/provider-preferences.types';

@Injectable()
export class GetProviderCatalogUseCase {
	constructor(
		private readonly providerCatalogService: ProviderCatalogService
	) {}

	execute(): ProviderCatalog {
		return this.providerCatalogService.getCatalog();
	}
}
