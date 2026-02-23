import { Injectable } from '@nestjs/common';
import { ProviderCatalog } from '../../domain/entities/provider-preferences.types';

@Injectable()
export class ProviderCatalogService {
	getCatalog(): ProviderCatalog {
		return {
			image: [
				{
					id: 'openai',
					label: 'OpenAI Images',
					kind: 'image',
					status: 'active',
					costModel: { unit: 'image', price: 0.04, currency: 'USD' },
					capabilities: ['generation', 'high-quality'],
				},
				{
					id: 'stability',
					label: 'Stability AI',
					kind: 'image',
					status: 'coming_soon',
					costModel: { unit: 'image', price: 0.02, currency: 'USD' },
					capabilities: ['generation'],
				},
			],
			audio: [
				{
					id: 'openai',
					label: 'OpenAI TTS',
					kind: 'audio',
					status: 'active',
					costModel: { unit: 'minute', price: 0.015, currency: 'USD' },
					capabilities: ['tts'],
					voices: [
						{
							voiceId: 'alloy',
							label: 'Alloy',
							locale: 'en-US',
							gender: 'neutral',
							previewUrl: null,
							status: 'active',
						},
						{
							voiceId: 'nova',
							label: 'Nova',
							locale: 'en-US',
							gender: 'female',
							previewUrl: null,
							status: 'active',
						},
						{
							voiceId: 'echo',
							label: 'Echo',
							locale: 'en-US',
							gender: 'male',
							previewUrl: null,
							status: 'active',
						},
					],
				},
				{
					id: 'elevenlabs',
					label: 'ElevenLabs',
					kind: 'audio',
					status: 'coming_soon',
					costModel: { unit: 'minute', price: 0.3, currency: 'USD' },
					capabilities: ['tts', 'voice-clone'],
					voices: [],
				},
			],
			video: [
				{
					id: 'openai',
					label: 'OpenAI Video',
					kind: 'video',
					status: 'active',
					costModel: { unit: 'minute', price: 0.8, currency: 'USD' },
					capabilities: ['text-to-video'],
				},
				{
					id: 'runway',
					label: 'Runway',
					kind: 'video',
					status: 'coming_soon',
					costModel: { unit: 'minute', price: 2, currency: 'USD' },
					capabilities: ['video-edit', 'text-to-video'],
				},
			],
		};
	}
}
