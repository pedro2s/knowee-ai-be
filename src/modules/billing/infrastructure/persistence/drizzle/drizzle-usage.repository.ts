import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import {
	subscribers,
	subscriptionTier,
	tokenUsage,
} from 'src/shared/database/infrastructure/drizzle/schema';
import type { UsageRepositoryPort } from '../../../domain/ports/usage-repository.port';
import { SubscriptionResponseDto } from '../../../application/dtos/subscription.response.dto';
import { asc } from 'drizzle-orm';

@Injectable()
export class DrizzleUsageRepository implements UsageRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	async getActiveSubscription(userId: string): Promise<{
		id: string;
		createdAt: string;
	} | null> {
		const result = await this.drizzle.db.query.subscribers.findFirst({
			where: and(
				eq(subscribers.userId, userId),
				eq(subscribers.status, 'active')
			),
			columns: {
				id: true,
				createdAt: true,
			},
		});

		return result || null;
	}

	async getLatestSubscriptionSnapshot(userId: string): Promise<{
		id: string;
		createdAt: string;
		status: 'free' | 'active' | 'past_due' | 'canceled';
	} | null> {
		const result = await this.drizzle.db.query.subscribers.findFirst({
			where: eq(subscribers.userId, userId),
			columns: {
				id: true,
				createdAt: true,
				status: true,
			},
			orderBy: [desc(subscribers.createdAt)],
		});

		if (!result) {
			return null;
		}

		return {
			id: result.id,
			createdAt: result.createdAt,
			status: result.status as 'free' | 'active' | 'past_due' | 'canceled',
		};
	}

	async getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDate: Date
	): Promise<number> {
		const result = await this.drizzle.db
			.select({
				sum: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)`,
			})
			.from(tokenUsage)
			.where(
				and(
					eq(tokenUsage.userId, userId),
					eq(tokenUsage.subscriptionId, subscriptionId),
					gte(tokenUsage.createdAt, startDate.toISOString())
				)
			);

		return result[0]?.sum || 0;
	}

	async getSubscription(
		userId: string
	): Promise<SubscriptionResponseDto | null> {
		const result = await this.drizzle.db.query.subscribers.findFirst({
			where: eq(subscribers.userId, userId),
			with: {
				subscriptionTier: true,
			},
			orderBy: [desc(subscribers.createdAt)],
		});

		if (!result) return null;

		return {
			status: result.status as SubscriptionResponseDto['status'],
			subscription_tier: result.subscriptionTier
				? {
						id: result.subscriptionTier.id,
						name: result.subscriptionTier.name,
						monthlyTokenLimit: result.subscriptionTier.monthlyTokenLimit,
						price: result.subscriptionTier.price,
						stripePriceId: result.subscriptionTier.stripePriceId,
					}
				: null,
			subscription_end: result.subscriptionEnd,
			stripe_customer_id: result.stripeCustomerId,
		};
	}

	async createFreeSubscription(
		userId: string,
		email: string
	): Promise<SubscriptionResponseDto> {
		const existing = await this.drizzle.db.query.subscribers.findFirst({
			where: eq(subscribers.userId, userId),
			with: {
				subscriptionTier: true,
			},
			orderBy: [desc(subscribers.createdAt)],
		});

		if (existing) {
			return {
				status: existing.status as SubscriptionResponseDto['status'],
				subscription_tier: existing.subscriptionTier
					? {
							id: existing.subscriptionTier.id,
							name: existing.subscriptionTier.name,
							monthlyTokenLimit: existing.subscriptionTier.monthlyTokenLimit,
							price: existing.subscriptionTier.price,
							stripePriceId: existing.subscriptionTier.stripePriceId,
						}
					: null,
				subscription_end: existing.subscriptionEnd,
				stripe_customer_id: existing.stripeCustomerId,
			};
		}

		const freeTier = await this.drizzle.db.query.subscriptionTier.findFirst({
			where: eq(subscriptionTier.name, 'free'),
			orderBy: [asc(subscriptionTier.id)],
		});

		if (!freeTier) {
			throw new Error('Plano gratuito não encontrado');
		}

		await this.drizzle.db.insert(subscribers).values({
			userId,
			email,
			status: 'free',
			subscriptionTierId: freeTier.id,
		});

		return {
			status: 'free',
			subscription_tier: {
				id: freeTier.id,
				name: freeTier.name,
				monthlyTokenLimit: freeTier.monthlyTokenLimit,
				price: freeTier.price,
				stripePriceId: freeTier.stripePriceId,
			},
			subscription_end: null,
			stripe_customer_id: null,
		};
	}

	async getSubscriptionTierByName(name: string): Promise<{
		id: number;
		name: string;
		monthlyTokenLimit: number;
		price: string | null;
		stripePriceId: string | null;
	} | null> {
		const tier = await this.drizzle.db.query.subscriptionTier.findFirst({
			where: eq(subscriptionTier.name, name),
			orderBy: [asc(subscriptionTier.id)],
		});

		if (!tier) return null;

		return {
			id: tier.id,
			name: tier.name,
			monthlyTokenLimit: tier.monthlyTokenLimit,
			price: tier.price,
			stripePriceId: tier.stripePriceId,
		};
	}

	async getSubscriptionTierByStripePriceId(priceId: string): Promise<{
		id: number;
		name: string;
		monthlyTokenLimit: number;
		price: string | null;
		stripePriceId: string | null;
	} | null> {
		const tier = await this.drizzle.db.query.subscriptionTier.findFirst({
			where: eq(subscriptionTier.stripePriceId, priceId),
			orderBy: [asc(subscriptionTier.id)],
		});

		if (!tier) return null;

		return {
			id: tier.id,
			name: tier.name,
			monthlyTokenLimit: tier.monthlyTokenLimit,
			price: tier.price,
			stripePriceId: tier.stripePriceId,
		};
	}

	async getLatestSubscriberForUser(userId: string): Promise<{
		id: string;
		status: 'free' | 'active' | 'past_due' | 'canceled';
		subscriptionTierId: number | null;
		stripeCustomerId: string | null;
		stripeSubscriptionId: string | null;
	} | null> {
		const subscriber = await this.drizzle.db.query.subscribers.findFirst({
			where: eq(subscribers.userId, userId),
			columns: {
				id: true,
				status: true,
				subscriptionTierId: true,
				stripeCustomerId: true,
				stripeSubscriptionId: true,
			},
			orderBy: [desc(subscribers.createdAt)],
		});

		if (!subscriber) return null;

		return {
			id: subscriber.id,
			status: subscriber.status as 'free' | 'active' | 'past_due' | 'canceled',
			subscriptionTierId: subscriber.subscriptionTierId ?? null,
			stripeCustomerId: subscriber.stripeCustomerId ?? null,
			stripeSubscriptionId: subscriber.stripeSubscriptionId ?? null,
		};
	}

	async updateSubscriberById(
		id: string,
		patch: {
			status?: 'free' | 'active' | 'past_due' | 'canceled';
			subscriptionTierId?: number;
			stripeCustomerId?: string | null;
			stripeSubscriptionId?: string | null;
			subscriptionEnd?: string | null;
		}
	): Promise<void> {
		await this.drizzle.db
			.update(subscribers)
			.set(
				Object.fromEntries(
					Object.entries({
						status: patch.status,
						subscriptionTierId: patch.subscriptionTierId,
						stripeCustomerId: patch.stripeCustomerId,
						stripeSubscriptionId: patch.stripeSubscriptionId,
						subscriptionEnd: patch.subscriptionEnd,
						updatedAt: new Date().toISOString(),
					}).filter(([, value]) => value !== undefined)
				)
			)
			.where(eq(subscribers.id, id));
	}

	async updateSubscriberByStripeSubscriptionId(
		stripeSubscriptionId: string,
		patch: {
			status?: 'free' | 'active' | 'past_due' | 'canceled';
			subscriptionTierId?: number;
			stripeCustomerId?: string | null;
			subscriptionEnd?: string | null;
		}
	): Promise<void> {
		await this.drizzle.db
			.update(subscribers)
			.set(
				Object.fromEntries(
					Object.entries({
						status: patch.status,
						subscriptionTierId: patch.subscriptionTierId,
						stripeCustomerId: patch.stripeCustomerId,
						subscriptionEnd: patch.subscriptionEnd,
						updatedAt: new Date().toISOString(),
					}).filter(([, value]) => value !== undefined)
				)
			)
			.where(eq(subscribers.stripeSubscriptionId, stripeSubscriptionId));
	}
}
