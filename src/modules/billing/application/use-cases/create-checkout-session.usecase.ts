import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/shared/stripe/stripe.constants';
import {
	USAGE_REPOSITORY,
	type UsageRepositoryPort,
} from '../../domain/ports/usage-repository.port';
import { ConfigService } from '@nestjs/config';

export type BillingCycle = 'monthly' | 'annual';

@Injectable()
export class CreateCheckoutSessionUseCase {
	constructor(
		@Inject(USAGE_REPOSITORY)
		private readonly usageRepository: UsageRepositoryPort,
		@Inject(STRIPE_CLIENT)
		private readonly stripe: Stripe,
		private readonly configService: ConfigService
	) {}

	async execute(input: {
		userId: string;
		email: string;
		planName: string;
		billingCycle: BillingCycle;
	}): Promise<{ url: string }> {
		const tier = await this.usageRepository.getSubscriptionTierByName(
			input.planName
		);
		if (!tier) {
			throw new NotFoundException('Plano não encontrado.');
		}
		const stripePriceId =
			input.billingCycle === 'annual'
				? tier.stripePriceIdAnnual
				: tier.stripePriceId;

		if (!stripePriceId) {
			throw new BadRequestException(
				input.billingCycle === 'annual'
					? 'Plano sem price_id Stripe anual.'
					: 'Plano sem price_id Stripe.'
			);
		}

		let subscriber = await this.usageRepository.getLatestSubscriberForUser(
			input.userId
		);
		if (!subscriber) {
			// throw new NotFoundException('Assinatura não encontrada.');
			subscriber = (await this.usageRepository.createFreeSubscription(
				input.userId,
				input.email
			)) as unknown as {
				id: string;
				status: 'free' | 'active' | 'past_due' | 'canceled';
				subscriptionTierId: number | null;
				stripeCustomerId: string | null;
				stripeSubscriptionId: string | null;
			} | null;

			if (!subscriber) {
				throw new BadRequestException(
					'Não foi possível criar assinatura gratuita.'
				);
			}
		}

		if (
			subscriber.status === 'active' &&
			subscriber.subscriptionTierId === tier.id
		) {
			throw new BadRequestException('O plano atual já está ativo.');
		}

		let stripeCustomerId = subscriber.stripeCustomerId;
		if (!stripeCustomerId) {
			const customer = await this.stripe.customers.create({
				email: input.email,
				metadata: {
					user_id: input.userId,
				},
			});
			stripeCustomerId = customer.id;
			await this.usageRepository.updateSubscriberById(subscriber.id, {
				stripeCustomerId,
			});
		}

		const appUrl = this.configService.getOrThrow<string>('APP_URL');

		const session = await this.stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: stripeCustomerId,
			line_items: [
				{
					quantity: 1,
					price: stripePriceId,
				},
			],
			success_url: `${appUrl}/billing/success`,
			cancel_url: `${appUrl}/billing/cancel`,
			metadata: {
				user_id: input.userId,
				subscription_tier_id: String(tier.id),
			},
			subscription_data: {
				metadata: {
					user_id: input.userId,
					subscription_tier_id: String(tier.id),
				},
			},
		});

		if (!session.url) {
			throw new BadRequestException('Não foi possível gerar a sessão.');
		}

		return { url: session.url };
	}
}
