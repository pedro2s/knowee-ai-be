const scorm = (function () {
	let API = null;

	// Procura a API SCORM na janela atual e nas janelas-pai
	function findAPI(win) {
		let findAPITries = 0;
		while (win.API == null && win.parent != null && win.parent != win) {
			findAPITries++;
			if (findAPITries > 7) {
				console.error(
					'Erro ao procurar a API SCORM. Limite de tentativas excedido.'
				);
				return null;
			}
			win = win.parent;
		}
		return win.API;
	}

	// Inicializa a conexão com o LMS
	function init() {
		const win = window;
		API = findAPI(win);
		if (API == null && win.opener != null && typeof win.opener != 'undefined') {
			API = findAPI(win.opener);
		}
		if (API == null) {
			console.error('Não foi possível encontrar a API SCORM.');
			return;
		}
		return API.LMSInitialize('');
	}

	// Encerra a comunicação com o LMS
	function quit() {
		if (API != null) {
			API.LMSFinish('');
			API = null;
		}
	}

	// Salva os dados no LMS
	function save() {
		if (API != null) {
			return API.LMSCommit('');
		}
	}

	// Define o status da lição ("completed", "incomplete", "passed", "failed")
	function setStatus(status) {
		if (API != null) {
			return API.LMSSetValue('cmi.core.lesson_status', status);
		}
		return false;
	}

	// Define a nota (0-100)
	function setScore(score) {
		if (API != null) {
			API.LMSSetValue('cmi.core.score.raw', score.toString());
		}
	}

	return {
		init,
		quit,
		save,
		setStatus,
		setScore,
	};
})();
