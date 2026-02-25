import { Injectable } from '@nestjs/common';
import {
	AccessAction,
	AccessContext,
	AccessDecision,
	UserEntitlements,
} from '../../domain/entities/access-control.types';

@Injectable()
export class AccessPolicyService {
	private readonly aiActions = new Set<AccessAction>([
		'ai.interaction',
		'quick_actions.execute',
	]);

	private readonly assetActions = new Set<AccessAction>([
		'assets.generate',
		'lesson.assets.manage',
	]);

	decide(
		action: AccessAction,
		entitlements: UserEntitlements,
		context: AccessContext
	): AccessDecision {
		const isFree = !entitlements.hasActiveSubscription;
		const sampleCourseId = entitlements.freemiumScope.sampleCourseId;
		const hasTokensRemaining =
			entitlements.monthlyTokenLimit === 0 ||
			entitlements.remainingTokensInPeriod > 0;

		if (entitlements.hasActiveSubscription) {
			if (
				this.aiActions.has(action) &&
				entitlements.monthlyTokenLimit > 0 &&
				entitlements.remainingTokensInPeriod <= 0
			) {
				return {
					allowed: false,
					reasonCode: 'TOKEN_LIMIT_EXCEEDED',
					message: 'Limite mensal de uso excedido para o plano atual.',
					upgradeRequired: true,
					nextStep: 'open_subscription_settings',
				};
			}
			return { allowed: true };
		}

		if (
			action === 'course.generate_async' ||
			action === 'course.create_manual'
		) {
			if (action === 'course.create_manual') {
				return {
					allowed: false,
					reasonCode: 'SUBSCRIPTION_REQUIRED',
					message: 'Criação manual de cursos exige assinatura ativa.',
					upgradeRequired: true,
					nextStep: 'open_subscription_settings',
				};
			}

			if (!entitlements.sampleConsumed) {
				return { allowed: true };
			}
			return {
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message:
					'Você já utilizou sua geração gratuita. Assine para criar novos cursos.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (action === 'course.export_scorm') {
			return {
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message: 'Exportação disponível apenas para assinantes.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (this.assetActions.has(action)) {
			return {
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message: 'Geração de assets exige assinatura ativa.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (this.aiActions.has(action)) {
			if (!hasTokensRemaining) {
				return {
					allowed: false,
					reasonCode: 'TOKEN_LIMIT_EXCEEDED',
					message:
						'Você atingiu o limite de uso do plano gratuito. Faça upgrade para continuar.',
					upgradeRequired: true,
					nextStep: 'open_subscription_settings',
				};
			}

			if (context.courseId) {
				if (!sampleCourseId || context.courseId !== sampleCourseId) {
					return {
						allowed: false,
						reasonCode: 'FREEMIUM_SCOPE_RESTRICTED',
						message:
							'No plano gratuito, apenas o curso de amostra pode ser acessado.',
						upgradeRequired: true,
						nextStep: 'open_subscription_settings',
					};
				}
			} else if (entitlements.sampleConsumed) {
				return {
					allowed: false,
					reasonCode: 'FREEMIUM_SCOPE_RESTRICTED',
					message:
						'No plano gratuito, apenas o curso de amostra pode ser acessado.',
					upgradeRequired: true,
					nextStep: 'open_subscription_settings',
				};
			}
		}

		const courseScopedActions = new Set<AccessAction>([
			'course.read',
			'course.update',
			'course.provider_preferences.update',
			'module.create',
			'module.read',
			'module.update',
			'module.delete',
			'lesson.read',
			'lesson.update',
			'lesson.reorder',
		]);

		if (courseScopedActions.has(action)) {
			if (!context.courseId) {
				return {
					allowed: false,
					reasonCode: 'RESOURCE_CONTEXT_REQUIRED',
					message: 'Contexto de curso obrigatório para esta operação.',
				};
			}
		}

		if (courseScopedActions.has(action) && !sampleCourseId) {
			return {
				allowed: false,
				reasonCode: 'RESOURCE_CONTEXT_REQUIRED',
				message: 'Não há curso de amostra disponível para esta conta.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (
			isFree &&
			context.courseId &&
			sampleCourseId &&
			context.courseId !== sampleCourseId
		) {
			return {
				allowed: false,
				reasonCode: 'FREEMIUM_SCOPE_RESTRICTED',
				message:
					'No plano gratuito, apenas o curso de amostra pode ser acessado.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		return { allowed: true };
	}
}
