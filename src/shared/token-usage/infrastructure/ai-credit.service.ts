import { Injectable } from '@nestjs/common';

const BILLABLE_UNITS_PER_CREDIT = 1_000;

@Injectable()
export class AICreditService {
	toCredits(units: number): number {
		if (units <= 0) {
			return 0;
		}

		return Math.ceil(units / BILLABLE_UNITS_PER_CREDIT);
	}

	toBillableUnits(credits: number): number {
		if (credits <= 0) {
			return 0;
		}

		return credits * BILLABLE_UNITS_PER_CREDIT;
	}
}
