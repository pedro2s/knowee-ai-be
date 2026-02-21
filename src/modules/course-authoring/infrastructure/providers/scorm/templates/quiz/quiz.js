let perguntaAtual = 0;
let acertos = 0;

const perguntaEl = document.getElementById('question');
const opcoesEl = document.getElementById('options');
const explicacaoEl = document.getElementById('description');
const nextBtn = document.getElementById('next-btn');

// Adiciona elemento de progresso
let progressoEl = document.createElement('div');
progressoEl.style.textAlign = 'right';
progressoEl.style.fontSize = '0.95em';
progressoEl.style.color = '#888';
perguntaEl.parentNode.insertBefore(progressoEl, perguntaEl);

function exibirPergunta() {
	explicacaoEl.textContent = '';
	const pergunta = quiz[perguntaAtual];
	perguntaEl.textContent = pergunta.question;
	progressoEl.textContent = `Pergunta ${perguntaAtual + 1} de ${quiz.length}`;
	opcoesEl.innerHTML = '';

	pergunta.options.forEach((option, index) => {
		const label = document.createElement('label');
		label.style.transition = 'background 0.2s, border 0.2s';
		const input = document.createElement('input');
		input.type = 'radio';
		input.name = 'option';
		input.value = option;
		input.tabIndex = 0;
		input.addEventListener('change', () => verificarResposta(index, label));
		label.appendChild(input);
		label.appendChild(document.createTextNode(option));
		opcoesEl.appendChild(label);
	});
	nextBtn.style.display = 'none';
}

exibirPergunta();

function verificarResposta(optionIndex, labelSelecionado) {
	const pergunta = quiz[perguntaAtual];
	const labels = opcoesEl.querySelectorAll('label');
	const inputs = opcoesEl.querySelectorAll('input[name="option"]');
	const correta = optionIndex === pergunta.correctAnswer;

	// Remove estilos anteriores
	labels.forEach((l) => {
		l.style.background = '#f3f6fa';
		l.style.borderColor = 'transparent';
	});

	if (correta) {
		labelSelecionado.style.background = '#d4edda';
		labelSelecionado.style.borderColor = '#4caf50';
		explicacaoEl.textContent = pergunta.explanation;
		acertos++;
	} else {
		labelSelecionado.style.background = '#ffeaea';
		labelSelecionado.style.borderColor = '#f44336';
		explicacaoEl.textContent = `Você errou! A resposta correta era: ${
			pergunta.options[pergunta.correctAnswer]
		}`;
		// Não desabilita, permite tentar novamente
	}
	inputs.forEach((input) => (input.disabled = true));
	nextBtn.style.display = 'inline-block';
	nextBtn.focus();
}

// Avançar com Enter
document.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && nextBtn.style.display !== 'none') {
		nextBtn.click();
	}
});

nextBtn.addEventListener('click', () => {
	perguntaAtual++;
	if (perguntaAtual < quiz.length) {
		exibirPergunta();
	} else {
		mostrarFinal();
	}
});

function mostrarFinal() {
	progressoEl.textContent = '';
	perguntaEl.textContent = 'Quiz concluído!';
	opcoesEl.innerHTML = '';
	explicacaoEl.textContent = 'Obrigado por participar! 🎉';
	nextBtn.style.display = 'none';

	// SCORM: Envia nota e status
	const score = Math.round((acertos / quiz.length) * 100);

	if (typeof pipwerks !== 'undefined' && pipwerks.SCORM) {
		// Envia nota
		if (pipwerks.SCORM.version === '2004') {
			pipwerks.SCORM.set('cmi.score.raw', score);
			pipwerks.SCORM.set('cmi.score.min', 0);
			pipwerks.SCORM.set('cmi.score.max', 100);
		} else {
			pipwerks.SCORM.set('cmi.core.score.raw', score);
			pipwerks.SCORM.set('cmi.core.score.min', 0);
			pipwerks.SCORM.set('cmi.core.score.max', 100);
		}

		// Envia status
		const status = score >= 70 ? 'completed' : 'incomplete';
		pipwerks.SCORM.status('set', status);

		// Salvar e encerrar sessão
		pipwerks.SCORM.save();
		setTimeout(() => {
			pipwerks.SCORM.quit();
		}, 1000);
	}
}
