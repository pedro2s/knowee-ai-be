import { Injectable } from '@nestjs/common';
import { ProviderCatalogService } from 'src/modules/provider-preferences/application/services/provider-catalog.service';
import { AIUsageMetrics } from 'src/shared/types/interaction';

const BILLABLE_UNITS_PER_USD = 100_000;

type TextPricing = {
	inputPer1M: number;
	outputPer1M: number;
};

@Injectable()
export class AIUsagePricingService {
	private readonly textPricing = new Map<string, TextPricing>([
		['openai:gpt-4.1', { inputPer1M: 2, outputPer1M: 8 }],
		['openai:gpt-4.1-mini', { inputPer1M: 0.4, outputPer1M: 1.6 }],
		['openai:gpt-4.1-nano', { inputPer1M: 0.1, outputPer1M: 0.4 }],
		['openai:gpt-4o-mini', { inputPer1M: 0.15, outputPer1M: 0.6 }],
		['openai:text-embedding-3-small', { inputPer1M: 0.02, outputPer1M: 0 }],
		['google:gemini-3-flash-preview', { inputPer1M: 0.35, outputPer1M: 1.05 }],
	]);

	constructor(
		private readonly providerCatalogService: ProviderCatalogService
	) {}

	normalize(metrics: AIUsageMetrics): AIUsageMetrics {
		const estimatedCostUsd =
			metrics.estimatedCostUsd ?? this.estimateCostUsd(metrics);
		const totalUnits =
			metrics.totalUnits ??
			metrics.totalTokens ??
			metrics.outputTokens ??
			metrics.inputTokens ??
			0;
		const explicitBillableUnits = metrics.billableUnits ?? 0;
		const billableUnits =
			explicitBillableUnits > 0
				? explicitBillableUnits
				: this.estimateBillableUnits({
						...metrics,
						estimatedCostUsd,
						totalUnits,
					});

		return {
			...metrics,
			provider: metrics.provider ?? 'unknown',
			operation: metrics.operation ?? 'legacy',
			modality: metrics.modality ?? 'text',
			unitType: metrics.unitType ?? 'tokens',
			totalUnits,
			billableUnits,
			estimatedCostUsd,
		};
	}

	private estimateBillableUnits(metrics: AIUsageMetrics): number {
		if (metrics.totalTokens && metrics.totalTokens > 0) {
			return metrics.totalTokens;
		}

		if (metrics.estimatedCostUsd && metrics.estimatedCostUsd > 0) {
			return Math.max(
				1,
				Math.round(metrics.estimatedCostUsd * BILLABLE_UNITS_PER_USD)
			);
		}

		const totalUnits = metrics.totalUnits ?? 0;
		return totalUnits > 0 ? totalUnits : 0;
	}

	private estimateCostUsd(metrics: AIUsageMetrics): number | undefined {
		if (
			metrics.modality === 'text' ||
			metrics.modality === 'analysis' ||
			metrics.modality === 'history_summary' ||
			metrics.modality === 'embedding'
		) {
			return this.estimateTextLikeCost(metrics);
		}

		if (metrics.modality === 'image') {
			return this.estimateCatalogCost(
				metrics.provider ?? 'unknown',
				'image',
				metrics.totalUnits || 1
			);
		}

		if (metrics.modality === 'tts') {
			if (metrics.unitType === 'audio_minute') {
				return this.estimateCatalogCost(
					metrics.provider ?? 'unknown',
					'audio',
					metrics.totalUnits || 1
				);
			}

			const estimatedMinutes =
				((metrics.metadata?.characterCount as number) ?? 0) / 900;
			if (estimatedMinutes > 0) {
				return this.estimateCatalogCost(
					metrics.provider ?? 'unknown',
					'audio',
					estimatedMinutes
				);
			}
		}

		return undefined;
	}

	private estimateTextLikeCost(metrics: AIUsageMetrics): number | undefined {
		const key = `${metrics.provider ?? 'unknown'}:${metrics.model}`;
		const pricing = this.textPricing.get(key);
		if (!pricing) {
			return undefined;
		}

		const inputTokens = metrics.inputTokens ?? metrics.totalTokens ?? 0;
		const outputTokens = metrics.outputTokens ?? 0;

		return (
			(inputTokens / 1_000_000) * pricing.inputPer1M +
			(outputTokens / 1_000_000) * pricing.outputPer1M
		);
	}

	private estimateCatalogCost(
		providerId: string,
		kind: 'image' | 'audio',
		units: number
	): number | undefined {
		const catalog = this.providerCatalogService.getCatalog();
		const entries = kind === 'image' ? catalog.image : catalog.audio;
		const provider = entries.find((entry) => entry.id === providerId);

		if (!provider) {
			return undefined;
		}

		return provider.costModel.price * units;
	}
}
