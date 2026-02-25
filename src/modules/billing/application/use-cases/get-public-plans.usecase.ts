import { Inject, Injectable } from '@nestjs/common';
import {
	USAGE_REPOSITORY,
	type UsageRepositoryPort,
} from '../../domain/ports/usage-repository.port';
import { PublicBillingPlansResponseDto } from '../dtos/public-billing-plans.response.dto';

@Injectable()
export class GetPublicPlansUseCase {
	constructor(
		@Inject(USAGE_REPOSITORY)
		private readonly usageRepository: UsageRepositoryPort
	) {}

	async execute(): Promise<PublicBillingPlansResponseDto> {
		const tiers = await this.usageRepository.listPublicSubscriptionTiers();

		return {
			plans: tiers.map((tier) => ({
				id: tier.name,
				displayName: tier.displayName,
				displayPrice: this.formatDisplayPrice(tier.price),
				billingPeriod: tier.billingPeriod,
				monthlyPrice: this.toNumberOrNull(tier.price),
				annualPrice: this.toNumberOrNull(tier.annualPrice),
				annualDiscountPercent: this.getAnnualDiscountPercent(
					tier.price,
					tier.annualPrice
				),
				description: tier.description,
				features: tier.features,
				monthlyTokenLimit: tier.monthlyTokenLimit,
				isHighlighted: tier.isHighlighted,
				isContactOnly: tier.isContactOnly,
				supportChannel: tier.supportChannel,
				supportSlaHours: tier.supportSlaHours,
			})),
			meta: {
				selfService: true,
				humanSupportPolicy: 'email_only_72h',
			},
		};
	}

	private formatDisplayPrice(price: string | null): string {
		if (!price) {
			return 'Sob consulta';
		}

		const normalized = Number(price);
		if (Number.isNaN(normalized)) {
			return 'Sob consulta';
		}

		return `R$ ${normalized.toFixed(0)}`;
	}

	private toNumberOrNull(value: string | null): number | null {
		if (!value) {
			return null;
		}

		const numericValue = Number(value);
		return Number.isNaN(numericValue) ? null : numericValue;
	}

	private getAnnualDiscountPercent(
		monthlyPriceRaw: string | null,
		annualPriceRaw: string | null
	): number | null {
		const monthlyPrice = this.toNumberOrNull(monthlyPriceRaw);
		const annualPrice = this.toNumberOrNull(annualPriceRaw);

		if (!monthlyPrice || !annualPrice || monthlyPrice <= 0) {
			return null;
		}

		const annualizedMonthly = monthlyPrice * 12;
		if (annualizedMonthly <= 0 || annualPrice >= annualizedMonthly) {
			return 0;
		}

		return Math.round(
			((annualizedMonthly - annualPrice) / annualizedMonthly) * 100
		);
	}
}
