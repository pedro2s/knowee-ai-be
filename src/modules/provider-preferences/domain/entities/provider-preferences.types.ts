export type ProviderStatus = 'active' | 'coming_soon' | 'disabled';
export type ProviderKind = 'image' | 'audio' | 'video';

export interface VoiceOption {
	voiceId: string;
	label: string;
	locale: string;
	gender: string;
	previewUrl: string | null;
	status: ProviderStatus;
}

export interface ProviderOption {
	id: string;
	label: string;
	kind: ProviderKind;
	status: ProviderStatus;
	costModel: {
		unit: 'image' | 'minute';
		price: number;
		currency: 'USD';
	};
	capabilities: string[];
	voices?: VoiceOption[];
}

export interface ProviderCatalog {
	image: ProviderOption[];
	audio: ProviderOption[];
	video: ProviderOption[];
}

export interface ProviderPreferenceSelection {
	imageProvider: string;
	audioProvider: string;
	audioVoiceId: string;
	videoProvider: string;
	advancedSettings?: Record<string, unknown>;
}

export interface EffectiveProviderPreferences {
	defaults: ProviderPreferenceSelection;
	courseOverride: ProviderPreferenceSelection | null;
	effective: ProviderPreferenceSelection;
}
