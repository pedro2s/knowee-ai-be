import { Injectable, Inject, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/shared/stripe/stripe.constants';
import {
	USAGE_REPOSITORY,
	type UsageRepositoryPort,
} from '../../domain/ports/usage-repository.port';

@Injectable()
export class HandleStripeWebhookUseCase {
	private readonly logger = new Logger(HandleStripeWebhookUseCase.name);

	constructor(
		@Inject(STRIPE_CLIENT)
		private readonly stripe: Stripe,
		@Inject(USAGE_REPOSITORY)
		private readonly usageRepository: UsageRepositoryPort
	) {}

	async execute(event: Stripe.Event): Promise<void> {
		switch (event.type) {
			case 'checkout.session.completed':
				await this.handleCheckoutCompleted(event.data.object);
				return;
			case 'invoice.paid':
				await this.handleInvoicePaid(event.data.object);
				return;
			case 'customer.subscription.updated':
				await this.handleSubscriptionUpdated(event.data.object);
				return;
			case 'customer.subscription.deleted':
				await this.handleSubscriptionDeleted(event.data.object);
				return;
			default:
				this.logger.debug(`Evento ignorado: ${event.type}`);
		}
	}

	private async handleCheckoutCompleted(
		session: Stripe.Checkout.Session
	): Promise<void> {
		const metadata = session.metadata ?? {};
		const userId = metadata.user_id;
		const tierId = metadata.subscription_tier_id
			? Number(metadata.subscription_tier_id)
			: undefined;
		if (!userId) {
			this.logger.warn('checkout.session.completed sem user_id.');
			return;
		}

		const subscriber =
			await this.usageRepository.getLatestSubscriberForUser(userId);
		if (!subscriber) {
			this.logger.warn('Subscriber não encontrado para user_id.');
			return;
		}

		const subscriptionId =
			typeof session.subscription === 'string'
				? session.subscription
				: session.subscription?.id;

		await this.usageRepository.updateSubscriberById(subscriber.id, {
			stripeCustomerId:
				typeof session.customer === 'string'
					? session.customer
					: (session.customer?.id ?? null),
			stripeSubscriptionId: subscriptionId ?? null,
			subscriptionTierId: tierId ?? subscriber.subscriptionTierId ?? undefined,
			status: session.payment_status === 'paid' ? 'active' : undefined,
		});
	}

	private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
		const invoiceSubscription =
			invoice.parent?.subscription_details?.subscription;
		if (!invoiceSubscription) {
			return;
		}

		const subscriptionId =
			typeof invoiceSubscription === 'string'
				? invoiceSubscription
				: invoiceSubscription.id;
		if (!subscriptionId) {
			return;
		}

		const subscription =
			await this.stripe.subscriptions.retrieve(subscriptionId);

		const priceId = subscription.items.data[0]?.price?.id;
		const tier = priceId
			? await this.usageRepository.getSubscriptionTierByStripePriceId(priceId)
			: null;

		await this.usageRepository.updateSubscriberByStripeSubscriptionId(
			subscriptionId,
			{
				status: 'active',
				subscriptionTierId: tier?.id,
				subscriptionEnd: this.getSubscriptionEndIsoDate(subscription),
			}
		);
	}

	private async handleSubscriptionUpdated(
		subscription: Stripe.Subscription
	): Promise<void> {
		const status = this.mapStripeStatus(subscription.status);
		const priceId = subscription.items.data[0]?.price?.id;
		const tier = priceId
			? await this.usageRepository.getSubscriptionTierByStripePriceId(priceId)
			: null;

		await this.usageRepository.updateSubscriberByStripeSubscriptionId(
			subscription.id,
			{
				status,
				subscriptionTierId: tier?.id,
				subscriptionEnd: this.getSubscriptionEndIsoDate(subscription),
			}
		);
	}

	private async handleSubscriptionDeleted(
		subscription: Stripe.Subscription
	): Promise<void> {
		await this.usageRepository.updateSubscriberByStripeSubscriptionId(
			subscription.id,
			{
				status: 'canceled',
				subscriptionEnd:
					this.getSubscriptionEndIsoDate(subscription) ??
					new Date().toISOString(),
			}
		);
	}

	private getSubscriptionEndIsoDate(
		subscription: Stripe.Subscription
	): string | undefined {
		const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
		const endTimestamp =
			currentPeriodEnd ?? subscription.cancel_at ?? subscription.ended_at;

		return endTimestamp
			? new Date(endTimestamp * 1000).toISOString()
			: undefined;
	}

	private mapStripeStatus(
		status: Stripe.Subscription.Status
	): 'active' | 'past_due' | 'canceled' {
		switch (status) {
			case 'active':
			case 'trialing':
				return 'active';
			case 'past_due':
			case 'unpaid':
				return 'past_due';
			default:
				return 'canceled';
		}
	}
}
