export class PublicBillingPlanDto {
	id: string;
	displayName: string;
	displayPrice: string;
	billingPeriod: string | null;
	monthlyPrice: number | null;
	annualPrice: number | null;
	annualDiscountPercent: number | null;
	description: string | null;
	features: string[];
	monthlyTokenLimit: number;
	isHighlighted: boolean;
	isContactOnly: boolean;
	supportChannel: string;
	supportSlaHours: number;
}

export class PublicBillingPlansMetaDto {
	selfService: boolean;
	humanSupportPolicy: string;
}

export class PublicBillingPlansResponseDto {
	plans: PublicBillingPlanDto[];
	meta: PublicBillingPlansMetaDto;
}
