import { Injectable } from '@nestjs/common';
import { ProviderTypeMap } from '../../domain/ports/provider-type.map';

type ProviderType = keyof ProviderTypeMap;

@Injectable()
export class ProviderRegistry {
	private providers: Map<string, unknown> = new Map();

	register<T extends ProviderType>(
		providerName: string,
		type: T,
		instance: ProviderTypeMap[T]
	): void {
		this.providers.set(this.buildKey(providerName, type), instance);
	}

	get<T extends ProviderType>(
		providerName: string,
		type: T
	): ProviderTypeMap[T] {
		const provider = this.providers.get(this.buildKey(providerName, type));
		if (!provider) {
			throw new Error(`Provider não encontrado: ${providerName} [${type}]`);
		}
		return provider as ProviderTypeMap[T];
	}

	private buildKey(providerName: string, type: ProviderType): string {
		return `${type}:${providerName}`;
	}
}
