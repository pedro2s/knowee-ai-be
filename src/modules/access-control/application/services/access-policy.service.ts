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
		'assets.generate',
		'lesson.assets.manage',
	]);

	decide(
		action: AccessAction,
		entitlements: UserEntitlements,
		context: AccessContext
	): AccessDecision {
		if (entitlements.hasActiveSubscription) {
			if (
				this.aiActions.has(action) &&
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

		if (this.aiActions.has(action)) {
			if (!entitlements.sampleConsumed) {
				return { allowed: true };
			}
			return {
				allowed: false,
				reasonCode: 'FREEMIUM_AI_BLOCKED',
				message:
					'Interações com IA estão indisponíveis no plano gratuito após a amostra.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (action === 'module.create' || action === 'module.delete') {
			return {
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message: 'Criação e remoção de módulos exigem assinatura ativa.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (action === 'lesson.reorder') {
			return {
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message: 'Reordenação de aulas exige assinatura ativa.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		const sampleCourseId = entitlements.freemiumScope.sampleCourseId;
		if (!sampleCourseId) {
			return {
				allowed: false,
				reasonCode: 'RESOURCE_CONTEXT_REQUIRED',
				message: 'Não há curso de amostra disponível para esta conta.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (
			action === 'course.read' ||
			action === 'course.provider_preferences.update'
		) {
			if (!context.courseId) {
				return {
					allowed: false,
					reasonCode: 'RESOURCE_CONTEXT_REQUIRED',
					message: 'Contexto de curso obrigatório para esta operação.',
				};
			}

			if (context.courseId !== sampleCourseId) {
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

		if (action === 'course.update') {
			return {
				allowed: false,
				reasonCode: 'SUBSCRIPTION_REQUIRED',
				message:
					'Edição geral do curso está disponível apenas para assinantes.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (action === 'module.read' || action === 'module.update') {
			const firstModuleId = entitlements.freemiumScope.firstModuleId;
			if (!firstModuleId || context.moduleId !== firstModuleId) {
				return {
					allowed: false,
					reasonCode: 'FREEMIUM_SCOPE_RESTRICTED',
					message:
						'No plano gratuito, apenas o módulo 1 do curso de amostra está disponível.',
					upgradeRequired: true,
					nextStep: 'open_subscription_settings',
				};
			}
			return { allowed: true };
		}

		if (action === 'lesson.read' || action === 'lesson.update') {
			const firstLessonId = entitlements.freemiumScope.firstLessonId;
			if (!firstLessonId || context.lessonId !== firstLessonId) {
				return {
					allowed: false,
					reasonCode: 'FREEMIUM_SCOPE_RESTRICTED',
					message:
						'No plano gratuito, apenas a aula 1 do módulo 1 está disponível.',
					upgradeRequired: true,
					nextStep: 'open_subscription_settings',
				};
			}
			return { allowed: true };
		}

		return { allowed: true };
	}
}
