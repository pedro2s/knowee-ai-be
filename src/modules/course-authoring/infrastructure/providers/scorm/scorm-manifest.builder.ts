import { Injectable } from '@nestjs/common';
import type { ScormCourseExportInput } from '../../../domain/entities/scorm-export.types';

@Injectable()
export class ScormManifestBuilder {
	build(data: ScormCourseExportInput): string {
		const escape = (value: string) => this.xmlEscape(value);
		const manifestIdentifier = `MANIFEST-${data.id}`;
		const organizationIdentifier = `ORG-${data.id}`;

		const items: string[] = [];
		const resources: string[] = [];

		for (
			let moduleIndex = 0;
			moduleIndex < data.modules.length;
			moduleIndex++
		) {
			const module = data.modules[moduleIndex];
			const moduleIdentifier = `ITEM-MODULE-${module.id}`;
			const lessonItems: string[] = [];

			for (
				let lessonIndex = 0;
				lessonIndex < module.lessons.length;
				lessonIndex++
			) {
				const lesson = module.lessons[lessonIndex];
				const lessonItemIdentifier = `ITEM-LESSON-${lesson.id}`;
				const resourceIdentifier = `RESOURCE-LESSON-${lesson.id}`;
				const scoDir = `sco${moduleIndex + 1}_${lessonIndex + 1}`;

				lessonItems.push(
					`<item identifier="${escape(lessonItemIdentifier)}" identifierref="${escape(resourceIdentifier)}">
<title>${escape(lesson.title)}</title>
<metadata><lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1"><general><description><langstring xml:lang="pt-BR">${escape(lesson.description || '')}</langstring></description></general></lom></metadata>
</item>`
				);

				if (
					(lesson.lessonType === 'video' || lesson.lessonType === 'audio') &&
					!lesson.shouldUseVideoFallback
				) {
					const encodedMediaUrl = encodeURIComponent(
						lesson.resolvedMediaUrl || ''
					);
					resources.push(
						`<resource identifier="${escape(resourceIdentifier)}" type="webcontent" adlcp:scormtype="sco" href="${escape(`${scoDir}/player.html?videoUrl=${encodedMediaUrl}`)}">
<file href="${escape(`${scoDir}/player.html`)}"/>
<file href="${escape(`${scoDir}/scorm_api_wrapper.js`)}"/>
</resource>`
					);
					continue;
				}

				if (lesson.lessonType === 'quiz') {
					resources.push(
						`<resource identifier="${escape(resourceIdentifier)}" type="webcontent" adlcp:scormtype="sco" href="${escape(`${scoDir}/quiz.html`)}">
<file href="${escape(`${scoDir}/quiz.html`)}"/>
<file href="${escape(`${scoDir}/quiz.js`)}"/>
<file href="${escape(`${scoDir}/scormdriver.js`)}"/>
</resource>`
					);
					continue;
				}

				resources.push(
					`<resource identifier="${escape(resourceIdentifier)}" type="webcontent" adlcp:scormtype="sco" href="${escape(`${scoDir}/index.html`)}">
<file href="${escape(`${scoDir}/index.html`)}"/>
<file href="${escape(`${scoDir}/scorm_api_wrapper.js`)}"/>
</resource>`
				);
			}

			items.push(
				`<item identifier="${escape(moduleIdentifier)}">
<title>${escape(module.title)}</title>
<metadata><lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1"><general><description><langstring xml:lang="pt-BR">${escape(module.description || '')}</langstring></description></general></lom></metadata>
${lessonItems.join('\n')}
</item>`
			);
		}

		return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<manifest identifier="${escape(manifestIdentifier)}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
<metadata>
<schema>ADL SCORM</schema>
<schemaversion>1.2</schemaversion>
<lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
<general>
<title><langstring xml:lang="pt-BR">${escape(data.title)}</langstring></title>
<description><langstring xml:lang="pt-BR">${escape(data.description || '')}</langstring></description>
<learningResourceType><source>LOMV1.0</source><value>${escape(data.category || '')}</value></learningResourceType>
</general>
<annotations><entity>objetivos</entity><description><langstring xml:lang="pt-BR">${escape(data.objectives || '')}</langstring></description></annotations>
<educational>
<intendedEndUserRole><source>LOMV1.0</source><value>${escape(data.targetAudience || '')}</value></intendedEndUserRole>
<difficulty><source>LOMV1.0</source><value>${escape(data.level || '')}</value></difficulty>
<typicalLearningTime><duration>${escape(data.duration || '')}</duration></typicalLearningTime>
</educational>
</lom>
</metadata>
<organizations default="${escape(organizationIdentifier)}">
<organization identifier="${escape(organizationIdentifier)}">
<title>${escape(data.title)}</title>
${items.join('\n')}
</organization>
</organizations>
<resources>
${resources.join('\n')}
</resources>
</manifest>`;
	}

	private xmlEscape(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&apos;');
	}
}
