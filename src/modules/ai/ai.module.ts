import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AudioProviderRegistry } from './infrasctructure/providers/audio-provider.registry';
import { OpenAIAudioGeneratorAdapter } from './infrasctructure/providers/openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './infrasctructure/providers/openai/openai-image-generator.adapter';

export const OPENAI_CLIENT = 'OPENAI_CLIENT';

@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new OpenAI({
          apiKey: configService.getOrThrow<string>('OPENAI_API_KEY'),
        });
      },
      inject: [ConfigService],
    },
    AudioProviderRegistry,
    OpenAIAudioGeneratorAdapter,
    OpenAIImageGeneratorAdapter,
  ],
  exports: [OPENAI_CLIENT],
})
export class AIModule {}
