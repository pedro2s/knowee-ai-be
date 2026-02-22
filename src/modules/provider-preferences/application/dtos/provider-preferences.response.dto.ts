import {
	EffectiveProviderPreferences,
	ProviderCatalog,
} from '../../domain/entities/provider-preferences.types';

export class ProviderCatalogResponseDto {
	image: ProviderCatalog['image'];
	audio: ProviderCatalog['audio'];
	video: ProviderCatalog['video'];

	static fromDomain(catalog: ProviderCatalog): ProviderCatalogResponseDto {
		return {
			image: catalog.image,
			audio: catalog.audio,
			video: catalog.video,
		};
	}
}

export class EffectiveProviderPreferencesResponseDto {
	defaults: EffectiveProviderPreferences['defaults'];
	courseOverride: EffectiveProviderPreferences['courseOverride'];
	effective: EffectiveProviderPreferences['effective'];

	static fromDomain(
		prefs: EffectiveProviderPreferences
	): EffectiveProviderPreferencesResponseDto {
		return {
			defaults: prefs.defaults,
			courseOverride: prefs.courseOverride,
			effective: prefs.effective,
		};
	}
}
