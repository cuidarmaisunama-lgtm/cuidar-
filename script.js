// =====================================================
// ARMAZENAMENTO
// (os dados ficam guardados no aparelho do cuidador)
// =====================================================

function carregarLista(chave) {
    const dados = localStorage.getItem(chave);
    if (!dados) return [];
    try {
        return JSON.parse(dados);
    } catch (erro) {
        return [];
    }
}

function salvarLista(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(lista));
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function carregarCuidador() {
    const dados = localStorage.getItem("cuidarplus_cuidador");
    if (!dados) return null;
    try {
        return JSON.parse(dados);
    } catch (erro) {
        return null;
    }
}

let cuidador = carregarCuidador();
let idosos = carregarLista("cuidarplus_idosos");

let idosoAtualId = null;   // qual idoso está aberto no momento
let idosoEmEdicaoId = null; // usado no formulário de idoso (edição x cadastro novo)

let rotinaEmEdicaoId = null;
let medicamentoEmEdicaoId = null;
let alimentacaoEmEdicaoId = null;
let consultaEmEdicaoId = null;

let formularioAtualId = null;   // qual tela de formulário está aberta agora
let snapshotFormulario = null;  // valores dos campos no momento em que o formulário abriu


// =====================================================
// NAVEGAÇÃO ENTRE TELAS
// =====================================================

function mostrarTela(tela) {
    document.querySelectorAll(".tela").forEach(function (elemento) {
        elemento.classList.add("escondida");
    });

    const alvo = document.getElementById(tela);
    alvo.classList.remove("escondida");

    // move o foco pra tela nova, ajuda quem navega por teclado ou leitor de tela
    alvo.setAttribute("tabindex", "-1");
    alvo.focus({ preventScroll: true });
}

function encontrarIdoso(id) {
    return idosos.find(function (item) { return item.id === id; });
}


// =====================================================
// AVISO DE ALTERAÇÕES NÃO SALVAS (formulários)
// =====================================================

function valoresDoFormulario(formularioId) {
    const form = document.querySelector("#" + formularioId + " form");
    return Array.from(form.elements)
        .filter(function (el) { return el.tagName !== "BUTTON"; })
        .map(function (el) { return el.type === "checkbox" ? el.checked : el.value; });
}

function capturarSnapshotFormulario(formularioId) {
    formularioAtualId = formularioId;
    snapshotFormulario = JSON.stringify(valoresDoFormulario(formularioId));
}

function formularioFoiAlterado() {
    if (!formularioAtualId) return false;
    return JSON.stringify(valoresDoFormulario(formularioAtualId)) !== snapshotFormulario;
}

function sairFormulario(acaoVoltar) {
    if (formularioFoiAlterado() && !confirm("Você tem alterações não salvas. Deseja sair sem salvar?")) {
        return;
    }
    formularioAtualId = null;
    acaoVoltar();
}


// =====================================================
// DIAS DA SEMANA (usado em Rotina, Medicamentos e Alimentação)
// =====================================================

const ORDEM_DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const NOMES_DIAS = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };

function coletarDias(containerId) {
    return Array.from(document.querySelectorAll("#" + containerId + " input[data-dia]:checked"))
        .map(function (cb) { return cb.value; });
}

function limparDias(containerId) {
    document.querySelectorAll("#" + containerId + " input").forEach(function (cb) {
        cb.checked = false;
    });
}

function alternarTodosDias(containerId) {
    const todos = document.getElementById(containerId + "Todos");
    document.querySelectorAll("#" + containerId + " input[data-dia]").forEach(function (cb) {
        cb.checked = todos.checked;
    });
}

function marcarDias(containerId, dias) {
    document.querySelectorAll("#" + containerId + " input[data-dia]").forEach(function (cb) {
        cb.checked = dias.includes(cb.value);
    });
    sincronizarTodos(containerId);
}

function sincronizarTodos(containerId) {
    const todos = document.getElementById(containerId + "Todos");
    const checkboxes = document.querySelectorAll("#" + containerId + " input[data-dia]");
    const marcados = Array.from(checkboxes).filter(function (cb) { return cb.checked; }).length;
    todos.checked = marcados === checkboxes.length;
}

function formatarDias(dias) {
    const ordenados = dias.slice().sort(function (a, b) {
        return ORDEM_DIAS.indexOf(a) - ORDEM_DIAS.indexOf(b);
    });

    if (ordenados.length === 7) return "Todos os dias";

    const diasUteis = ["seg", "ter", "qua", "qui", "sex"];
    if (ordenados.length === 5 && diasUteis.every(function (d) { return ordenados.includes(d); })) {
        return "Segunda a sexta-feira";
    }

    return ordenados.map(function (d) { return NOMES_DIAS[d]; }).join(", ");
}

function horariosDoMedicamento(item) {
    if (item.horarios && item.horarios.length) return item.horarios;
    if (item.horario) return [item.horario];
    return [];
}

function diaAtualAbrev() {
    const mapa = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    return mapa[new Date().getDay()];
}

function formatarData(data) {
    // transforma "2026-09-15" em "15/09/2026"
    const partes = data.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function diasAteData(data) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(data + "T00:00:00");
    return Math.round((alvo - hoje) / (1000 * 60 * 60 * 24));
}

function descreverPrazo(dias) {
    if (dias < 0) return "atrasada";
    if (dias === 0) return "hoje";
    if (dias === 1) return "amanhã";
    return "em " + dias + " dias";
}

function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento + "T00:00:00");
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const aindaNaoFezAniversario =
        hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
    if (aindaNaoFezAniversario) idade--;
    return idade;
}

function renderizarChips(inputId, containerId) {
    const valores = JSON.parse(document.getElementById(inputId).value || "[]");
    const container = document.getElementById(containerId);
    const classeChip = containerId === "listaAlergias" ? "chip chip-perigo" : "chip";
    container.innerHTML = valores.map(function (v, i) {
        return "<span class='" + classeChip + "'>" + escaparHtml(v) + "<button type='button' onclick=\"removerChip('" + inputId + "','" + containerId + "'," + i + ")\">×</button></span>";
    }).join("");
}

function definirChips(inputId, containerId, valores) {
    document.getElementById(inputId).value = JSON.stringify(valores);
    renderizarChips(inputId, containerId);
}

function adicionarChip(inputId, containerId, campoTextoId) {
    const campoTexto = document.getElementById(campoTextoId);
    const texto = campoTexto.value.trim();
    if (!texto) return;
    const valores = JSON.parse(document.getElementById(inputId).value || "[]");
    valores.push(texto);
    document.getElementById(inputId).value = JSON.stringify(valores);
    campoTexto.value = "";
    renderizarChips(inputId, containerId);
}

function removerChip(inputId, containerId, indice) {
    const valores = JSON.parse(document.getElementById(inputId).value || "[]");
    valores.splice(indice, 1);
    document.getElementById(inputId).value = JSON.stringify(valores);
    renderizarChips(inputId, containerId);
}

function escaparHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function aplicarTema(tema) {
    document.documentElement.setAttribute("data-tema", tema);
    document.getElementById("iconeTema")
        .querySelector("use")
        .setAttribute("href", tema === "escuro" ? "#icone-sol" : "#icone-lua");
}

function alternarTema() {
    const atual = document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro";
    const novo = atual === "escuro" ? "claro" : "escuro";
    localStorage.setItem("cuidarplus_tema", novo);
    aplicarTema(novo);
}

const NIVEIS_FONTE = [1, 1.15, 1.3];

function aplicarFonte(nivel) {
    document.documentElement.style.setProperty("--zoom-conteudo", NIVEIS_FONTE[nivel]);
    document.documentElement.setAttribute("data-nivel-fonte", nivel);
}

function aumentarFonte() {
    const nivel = Math.min(nivelFonteAtual() + 1, NIVEIS_FONTE.length - 1);
    localStorage.setItem("cuidarplus_nivel_fonte", nivel);
    aplicarFonte(nivel);
}

function diminuirFonte() {
    const nivel = Math.max(nivelFonteAtual() - 1, 0);
    localStorage.setItem("cuidarplus_nivel_fonte", nivel);
    aplicarFonte(nivel);
}

function restaurarFonte() {
    localStorage.setItem("cuidarplus_nivel_fonte", 0);
    aplicarFonte(0);
}

function nivelFonteAtual() {
    return parseInt(document.documentElement.getAttribute("data-nivel-fonte") || "0", 10);
}

function abrirMenuLateral() {
    document.getElementById("menuLateral").classList.remove("escondida");
    document.getElementById("overlayMenu").classList.remove("escondida");
    document.getElementById("dashboard").querySelector(".botao-hamburguer").setAttribute("aria-expanded", "true");
}

function fecharMenuLateral() {
    document.getElementById("menuLateral").classList.add("escondida");
    document.getElementById("overlayMenu").classList.add("escondida");
    document.getElementById("dashboard").querySelector(".botao-hamburguer").setAttribute("aria-expanded", "false");
}

function alternarMenuLateral() {
    if (document.getElementById("menuLateral").classList.contains("escondida")) {
        abrirMenuLateral();
    } else {
        fecharMenuLateral();
    }
}

function abrirSobre() {
    fecharMenuLateral();
    document.getElementById("modalSobre").classList.remove("escondida");
    document.getElementById("overlaySobre").classList.remove("escondida");
}

function abrirComoUsar() {
    fecharMenuLateral();
    mostrarTela("comoUsar");
}


// =====================================================
// RELATÓRIO EM PDF
// =====================================================

const MAPA_DIA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const NOMES_DIAS_COMPLETOS = { dom: "Domingo", seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado" };

const CORES_RELATORIO = {
    primaria: [47, 111, 98],
    rotina: [53, 97, 140],
    alimentacao: [191, 107, 61],
    consulta: [185, 121, 31],
    texto: [31, 42, 36],
    textoSuave: [91, 107, 98],
    borda: [225, 233, 226],
    linhaAlternada: [245, 246, 245]
};

function abrirModalRelatorio() {
    const select = document.getElementById("relatorioIdoso");
    select.innerHTML = "<option value='todos'>Todos os idosos</option>";
    idosos.forEach(function (idoso) {
        const opcao = document.createElement("option");
        opcao.value = idoso.id;
        opcao.textContent = idoso.nome;
        select.appendChild(opcao);
    });

    document.getElementById("modalRelatorio").classList.remove("escondida");
    document.getElementById("overlayRelatorio").classList.remove("escondida");
}

function fecharModalRelatorio() {
    document.getElementById("modalRelatorio").classList.add("escondida");
    document.getElementById("overlayRelatorio").classList.add("escondida");
}

function confirmarGerarRelatorio(event) {
    if (event) event.preventDefault();

    const periodo = document.querySelector("input[name='periodoRelatorio']:checked").value;
    const idosoSelecionado = document.getElementById("relatorioIdoso").value;

    gerarRelatorioPDF(periodo, idosoSelecionado);
    fecharModalRelatorio();
}

function paraISO(dataObj) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    const dia = String(dataObj.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
}

function paraDataArquivo(dataObj) {
    const dia = String(dataObj.getDate()).padStart(2, "0");
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    return dia + "-" + mes + "-" + dataObj.getFullYear();
}

function sanitizarNomeArquivo(texto) {
    return texto
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function obterIntervaloRelatorio(periodo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (periodo === "diario") {
        return [hoje];
    }

    if (periodo === "semanal") {
        const diaSemana = hoje.getDay();
        const deltaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
        const segunda = new Date(hoje);
        segunda.setDate(hoje.getDate() + deltaSegunda);

        const datas = [];
        for (let i = 0; i < 7; i++) {
            const dataItem = new Date(segunda);
            dataItem.setDate(segunda.getDate() + i);
            datas.push(dataItem);
        }
        return datas;
    }

    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const datas = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
        datas.push(new Date(ano, mes, dia));
    }
    return datas;
}

function formatarObsConsultaRelatorio(consulta) {
    let obs = consulta.especialidade || "Consulta";
    if (consulta.profissional) obs += " — " + consulta.profissional;
    if (consulta.local) obs += " • " + consulta.local;
    return obs;
}

function obterAtividadesParaData(dataObj, idoso) {
    const diaAbrev = MAPA_DIA_SEMANA[dataObj.getDay()];
    const dataISO = paraISO(dataObj);
    const itens = [];

    (idoso.rotina || []).forEach(function (r) {
        if (r.dias.includes(diaAbrev)) {
            itens.push({ horario: r.inicio, atividade: "Início do período de cuidado", observacao: "" });
        }
    });

    (idoso.medicamentos || []).forEach(function (m) {
        if (m.dias.includes(diaAbrev)) {
            horariosDoMedicamento(m).forEach(function (h) {
                let obs = m.nome + (m.dosagem ? " — " + m.dosagem : "");
                if (m.observacao) obs += " (" + m.observacao + ")";
                itens.push({ horario: h, atividade: "Medicamento", observacao: obs });
            });
        }
    });

    (idoso.alimentacao || []).forEach(function (a) {
        if (a.dias.includes(diaAbrev)) {
            itens.push({ horario: a.horario, atividade: "Alimentação", observacao: a.tipo });
        }
    });

    (idoso.consultas || []).forEach(function (c) {
        if (c.tipo === "recorrente") {
            if (c.dias.includes(diaAbrev)) {
                itens.push({ horario: c.horario, atividade: "Consulta", observacao: formatarObsConsultaRelatorio(c) });
            }
        } else if (c.data === dataISO) {
            itens.push({ horario: c.horario, atividade: "Consulta", observacao: formatarObsConsultaRelatorio(c) });
        }
    });

    itens.sort(function (a, b) { return a.horario.localeCompare(b.horario); });
    return itens;
}

function corPorAtividadeRelatorio(atividade) {
    if (atividade === "Medicamento") return CORES_RELATORIO.primaria;
    if (atividade === "Alimentação") return CORES_RELATORIO.alimentacao;
    if (atividade === "Consulta") return CORES_RELATORIO.consulta;
    return CORES_RELATORIO.rotina;
}

function gerarRelatorioPDF(periodo, idosoIdOuTodos) {
    const jsPDFClasse = window.jspdf.jsPDF;
    const doc = new jsPDFClasse({ unit: "mm", format: "a4" });

    const margem = 15;
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const larguraUtil = larguraPagina - margem * 2;
    let y = margem;

    const idososRelatorio = idosoIdOuTodos === "todos"
        ? idosos.slice()
        : [encontrarIdoso(idosoIdOuTodos)].filter(function (item) { return !!item; });

    const datas = obterIntervaloRelatorio(periodo);

    const rotuloPeriodo = { diario: "Rotina diária", semanal: "Rotina semanal", mensal: "Rotina mensal" }[periodo];
    const rotuloIntervalo = periodo === "diario"
        ? formatarData(paraISO(datas[0]))
        : formatarData(paraISO(datas[0])) + " a " + formatarData(paraISO(datas[datas.length - 1]));
    const rotuloIdoso = idosoIdOuTodos === "todos" ? "Todos os idosos" : (idososRelatorio[0] ? idososRelatorio[0].nome : "");

    function garantirEspaco(altura) {
        if (y + altura > alturaPagina - margem) {
            doc.addPage();
            y = margem;
            return true;
        }
        return false;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor.apply(doc, CORES_RELATORIO.primaria);
    doc.text("CUIDAR+ — RELATÓRIO DE ROTINA", margem, y);
    y += 8;

    doc.setDrawColor.apply(doc, CORES_RELATORIO.primaria);
    doc.setLineWidth(0.6);
    doc.line(margem, y, larguraPagina - margem, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor.apply(doc, CORES_RELATORIO.texto);
    doc.text("Tipo: " + rotuloPeriodo, margem, y); y += 6;
    doc.text("Período: " + rotuloIntervalo, margem, y); y += 6;
    doc.text("Idoso: " + rotuloIdoso, margem, y); y += 6;
    doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
    doc.setFontSize(9);
    doc.text("Gerado em " + new Date().toLocaleString("pt-BR"), margem, y);
    y += 8;

    function desenharCabecalhoTabela() {
        const colHorario = margem;
        const colAtividade = margem + 22;
        const colObservacao = margem + 70;

        doc.setFillColor.apply(doc, CORES_RELATORIO.primaria);
        doc.rect(margem, y, larguraUtil, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Horário", colHorario + 2, y + 5.5);
        doc.text("Atividade", colAtividade + 2, y + 5.5);
        doc.text("Observação", colObservacao + 2, y + 5.5);
        y += 8;

        return { colHorario: colHorario, colAtividade: colAtividade, colObservacao: colObservacao };
    }

    function desenharTabelaDiaria(itens) {
        garantirEspaco(16);
        let colunas = desenharCabecalhoTabela();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        if (itens.length === 0) {
            doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
            doc.text("Nenhuma atividade cadastrada.", colunas.colHorario + 2, y + 5.5);
            y += 9;
            return;
        }

        itens.forEach(function (item, indice) {
            const pulouPagina = garantirEspaco(10);
            if (pulouPagina) colunas = desenharCabecalhoTabela();

            if (indice % 2 === 1) {
                doc.setFillColor.apply(doc, CORES_RELATORIO.linhaAlternada);
                doc.rect(margem, y, larguraUtil, 8, "F");
            }

            doc.setFillColor.apply(doc, corPorAtividadeRelatorio(item.atividade));
            doc.rect(colunas.colHorario, y + 1.5, 2, 5, "F");

            doc.setTextColor.apply(doc, CORES_RELATORIO.texto);
            doc.setFont("helvetica", "bold");
            doc.text(item.horario, colunas.colHorario + 5, y + 5.5);
            doc.setFont("helvetica", "normal");
            doc.text(item.atividade, colunas.colAtividade + 2, y + 5.5);
            doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
            const larguraObs = larguraUtil - (colunas.colObservacao - margem) - 4;
            const linhasObs = doc.splitTextToSize(item.observacao || "—", larguraObs);
            doc.text(linhasObs, colunas.colObservacao + 2, y + 5.5);

            y += 8;
        });

        y += 4;
    }

    function desenharListaPorData(idoso) {
        const yInicio = y;

        datas.forEach(function (dataObj) {
            const itens = obterAtividadesParaData(dataObj, idoso);
            if (itens.length === 0) return;

            garantirEspaco(12);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor.apply(doc, CORES_RELATORIO.rotina);
            const rotuloDia = NOMES_DIAS_COMPLETOS[MAPA_DIA_SEMANA[dataObj.getDay()]] + " — " + formatarData(paraISO(dataObj)).slice(0, 5);
            doc.text(rotuloDia.toUpperCase(), margem, y);
            y += 6;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            itens.forEach(function (item) {
                garantirEspaco(7);
                doc.setFillColor.apply(doc, corPorAtividadeRelatorio(item.atividade));
                doc.rect(margem + 2, y - 3, 2, 4, "F");
                doc.setTextColor.apply(doc, CORES_RELATORIO.texto);
                const linha = item.horario + " — " + item.atividade + (item.observacao ? " — " + item.observacao : "");
                const linhasQuebradas = doc.splitTextToSize(linha, larguraUtil - 10);
                doc.text(linhasQuebradas, margem + 7, y);
                y += 5 * linhasQuebradas.length + 1;
            });
            y += 3;
        });

        return y > yInicio;
    }

    if (idososRelatorio.length === 0) {
        doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
        doc.text("Nenhum idoso encontrado para gerar o relatório.", margem, y);
    } else if (idosoIdOuTodos === "todos") {
        idososRelatorio.forEach(function (idoso, indiceIdoso) {
            garantirEspaco(14);
            if (indiceIdoso > 0) y += 4;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor.apply(doc, CORES_RELATORIO.primaria);
            doc.text(idoso.nome.toUpperCase(), margem, y);
            y += 3;
            doc.setDrawColor.apply(doc, CORES_RELATORIO.borda);
            doc.setLineWidth(0.3);
            doc.line(margem, y, larguraPagina - margem, y);
            y += 6;

            if (periodo === "diario") {
                desenharTabelaDiaria(obterAtividadesParaData(datas[0], idoso));
            } else {
                const teveAtividade = desenharListaPorData(idoso);
                if (!teveAtividade) {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
                    doc.text("Nenhuma atividade cadastrada neste período.", margem, y);
                    y += 8;
                }
            }
        });
    } else {
        const idoso = idososRelatorio[0];
        if (periodo === "diario") {
            desenharTabelaDiaria(obterAtividadesParaData(datas[0], idoso));
        } else {
            const teveAtividade = desenharListaPorData(idoso);
            if (!teveAtividade) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
                doc.text("Nenhuma atividade cadastrada neste período.", margem, y);
            }
        }
    }

    const totalPaginas = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, CORES_RELATORIO.textoSuave);
        doc.text("Cuidar+ — Relatório de Rotina", margem, alturaPagina - 8);
        doc.text("Página " + p + " de " + totalPaginas, larguraPagina - margem, alturaPagina - 8, { align: "right" });
    }

    const nomeIdosoArquivo = idosoIdOuTodos === "todos" ? "Todos" : sanitizarNomeArquivo(rotuloIdoso);
    const nomeArquivo = "Cuidar+_Relatorio_Rotina_" + nomeIdosoArquivo + "_" + paraDataArquivo(new Date()) + ".pdf";
    doc.save(nomeArquivo);
}

function fecharSobre() {
    document.getElementById("modalSobre").classList.add("escondida");
    document.getElementById("overlaySobre").classList.add("escondida");
}

function iconeSvg(nome) {
    return "<svg class='icone'><use href='#icone-" + nome + "'/></svg>";
}


// =====================================================
// AVATAR E RESUMOS (identidade visual de cada idoso)
// =====================================================

const CORES_AVATAR = ["#2F6F62", "#35618C", "#B9791F", "#BF6B3D", "#6B4C9A", "#9A4C6B"];

function iniciais(nome) {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function corAvatar(id) {
    let soma = 0;
    for (let i = 0; i < id.length; i++) soma += id.charCodeAt(i);
    return CORES_AVATAR[soma % CORES_AVATAR.length];
}

function idosoTemAtrasoHoje(idoso) {
    const diaHoje = diaAtualAbrev();
    const agora = new Date();
    const horaAtual = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");
    const concluidos = carregarConcluidosHoje();

    let itens = [];
    (idoso.medicamentos || []).forEach(function (m) {
        horariosDoMedicamento(m).forEach(function (h) {
            itens.push({ horario: h, dias: m.dias, chave: "med-" + idoso.id + "-" + m.id + "-" + h });
        });
    });
    itens = itens
        .concat((idoso.alimentacao || []).map(function (a) { return { horario: a.horario, dias: a.dias, chave: "ali-" + idoso.id + "-" + a.id }; }))
        .concat((idoso.rotina || []).map(function (r) { return { horario: r.inicio, dias: r.dias, chave: "rot-" + idoso.id + "-" + r.id }; }))
        .concat((idoso.consultas || []).filter(function (c) { return c.tipo === "recorrente"; }).map(function (c) { return { horario: c.horario, dias: c.dias, chave: "con-" + idoso.id + "-" + c.id }; }));

    return itens.some(function (item) {
        return item.dias.includes(diaHoje) && item.horario < horaAtual && !concluidos.includes(item.chave);
    });
}

function linhaInfo(rotulo, valorSeguro) {
    return "<p><strong>" + rotulo + ":</strong> " + valorSeguro + "</p>";
}

function cartaoInfo(titulo, linhasHtml) {
    return "<div class='cartao-info'><h2>" + titulo + "</h2>" + linhasHtml + "</div>";
}

function renderizarInfoExtraIdoso(idoso) {
    const blocos = [];

    const pessoais = [];
    if (idoso.dataNascimento) pessoais.push(linhaInfo("Nascimento", escaparHtml(formatarData(idoso.dataNascimento))));
    if (idoso.genero) pessoais.push(linhaInfo("Gênero", escaparHtml(idoso.genero)));
    if (idoso.criadoEm) pessoais.push(linhaInfo("Cadastrado em", escaparHtml(new Date(idoso.criadoEm).toLocaleDateString("pt-BR"))));
    if (pessoais.length) blocos.push(cartaoInfo("Dados pessoais", pessoais.join("")));

    const enderecoPartes = [idoso.endereco, idoso.numero, idoso.bairro, idoso.cidade, idoso.estado, idoso.cep].filter(Boolean);
    if (enderecoPartes.length) blocos.push(cartaoInfo("Endereço", "<p>" + escaparHtml(enderecoPartes.join(", ")) + "</p>"));

    const medicas = [];
    if (idoso.mobilidade) medicas.push(linhaInfo("Mobilidade", escaparHtml(idoso.mobilidade)));
    if ((idoso.doencasCronicas || []).length) medicas.push(linhaInfo("Doenças crônicas", idoso.doencasCronicas.map(escaparHtml).join(", ")));
    if ((idoso.diagnosticos || []).length) medicas.push(linhaInfo("Diagnósticos", idoso.diagnosticos.map(escaparHtml).join(", ")));
    if (medicas.length) blocos.push(cartaoInfo("Informações médicas", medicas.join("")));

    const prefs = [];
    if (idoso.comidaFavorita) prefs.push(linhaInfo("Comida favorita", escaparHtml(idoso.comidaFavorita)));
    if (idoso.musicaFavorita) prefs.push(linhaInfo("Música favorita", escaparHtml(idoso.musicaFavorita)));
    if (idoso.hobbies) prefs.push(linhaInfo("Hobbies", escaparHtml(idoso.hobbies)));
    if (prefs.length) blocos.push(cartaoInfo("Preferências e hábitos", prefs.join("")));

    const emergencia = [];
    if (idoso.emergenciaNome) emergencia.push(linhaInfo("Nome", escaparHtml(idoso.emergenciaNome)));
    if (idoso.emergenciaTelefone) emergencia.push(linhaInfo("Telefone", escaparHtml(idoso.emergenciaTelefone)));
    if (idoso.emergenciaParentesco) emergencia.push(linhaInfo("Parentesco", escaparHtml(idoso.emergenciaParentesco)));
    if (emergencia.length) blocos.push(cartaoInfo("Contato de emergência", emergencia.join("")));

    document.getElementById("infoExtraIdoso").innerHTML = blocos.join("");
}

function resumoIdoso(idoso) {
    const partes = [];
    if (idoso.rotina.length) partes.push(iconeSvg('relogio') + " " + idoso.rotina.length);
    if (idoso.medicamentos.length) partes.push(iconeSvg('comprimido') + " " + idoso.medicamentos.length);
    if (idoso.alimentacao.length) partes.push(iconeSvg('prato') + " " + idoso.alimentacao.length);
    const consultasPendentes = idoso.consultas.filter(function (c) { return c.tipo !== "recorrente" && !c.concluida; }).length;
    if (consultasPendentes) partes.push(iconeSvg('calendario') + " " + consultasPendentes);
    return partes.length ? partes.join("   ") : "Nenhuma atividade cadastrada";
}


// =====================================================
// CUIDADOR
// =====================================================

function salvarCuidadorInicial(event) {
    event.preventDefault();

    cuidador = {
        nome: document.getElementById("nomeCuidadorInicial").value,
        telefone: document.getElementById("telefoneCuidadorInicial").value
    };

    localStorage.setItem("cuidarplus_cuidador", JSON.stringify(cuidador));
    iniciarApp();
}

function abrirPerfilCuidador() {
    document.getElementById("cuidadorNome").textContent = cuidador.nome;
    document.getElementById("cuidadorTelefone").textContent = cuidador.telefone;
    mostrarTela("perfilCuidador");
}

function abrirEdicaoCuidador() {
    document.getElementById("nomeCuidador").value = cuidador.nome;
    document.getElementById("telefoneCuidador").value = cuidador.telefone;
    mostrarTela("formularioCuidador");
    capturarSnapshotFormulario("formularioCuidador");
}

function salvarCuidador(event) {
    event.preventDefault();

    cuidador.nome = document.getElementById("nomeCuidador").value;
    cuidador.telefone = document.getElementById("telefoneCuidador").value;

    localStorage.setItem("cuidarplus_cuidador", JSON.stringify(cuidador));

    atualizarSaudacao();
    abrirPerfilCuidador();
}

function apagarTodosDados() {
    const aviso = idosos.length
        ? "Isso vai apagar seu perfil de cuidador(a) e TODOS os " + idosos.length + " idoso(s) cadastrado(s), com remédios, consultas, rotina e alimentação de cada um. Essa ação não pode ser desfeita."
        : "Isso vai apagar seu perfil de cuidador(a) e todos os dados salvos neste dispositivo. Essa ação não pode ser desfeita.";

    if (!confirm(aviso)) return;
    if (!confirm("Tem certeza absoluta? Todos os dados serão perdidos para sempre.")) return;

    localStorage.clear();
    location.reload();
}


// =====================================================
// IDOSOS (cadastro, listagem, edição, exclusão)
// =====================================================

function renderizarIdosos() {
    const lista = document.getElementById("listaIdosos");
    const campoBusca = document.getElementById("buscaIdosos");

    campoBusca.classList.toggle("escondida", idosos.length === 0);

    if (idosos.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhum idoso cadastrado ainda. Toque em \"Adicionar idoso\" para começar.</p>";
        return;
    }

    const termo = campoBusca.value.trim().toLowerCase();
    const filtrados = idosos.filter(function (idoso) {
        return idoso.nome.toLowerCase().includes(termo);
    });

    const ordenados = filtrados.slice().sort(function (a, b) {
        const atrasoA = idosoTemAtrasoHoje(a) ? 0 : 1;
        const atrasoB = idosoTemAtrasoHoje(b) ? 0 : 1;
        if (atrasoA !== atrasoB) return atrasoA - atrasoB;
        return a.nome.localeCompare(b.nome, "pt-BR");
    });

    lista.innerHTML = "";

    if (ordenados.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhum idoso encontrado com esse nome.</p>";
        return;
    }

    ordenados.forEach(function (idoso) {
        const card = document.createElement("div");
        card.classList.add("idoso-card");
        card.onclick = function () { abrirIdoso(idoso.id); };

        const atrasado = idosoTemAtrasoHoje(idoso);

        card.innerHTML =
            "<span class='idoso-avatar' aria-hidden='true' style='background:" + corAvatar(idoso.id) + "'>" + escaparHtml(iniciais(idoso.nome)) + "</span>" +
            "<span class='idoso-info'>" +
                "<strong>" + escaparHtml(idoso.nome) + (idoso.idade ? " · " + escaparHtml(idoso.idade) + " anos" : "") + "</strong>" +
                (atrasado ? "<small class='idoso-atrasado'>Atrasado hoje</small>" : "") +
                "<small>" + resumoIdoso(idoso) + "</small>" +
            "</span>" +
            "<span class='idoso-seta'>›</span>";

        lista.appendChild(card);
    });
}

function abrirFormularioIdoso(id) {
    const idoso = id ? encontrarIdoso(id) : null;

    idosoEmEdicaoId = id || null;
    document.getElementById("tituloFormularioIdoso").textContent = idoso ? "Editar idoso" : "Adicionar idoso";

    document.getElementById("nomeIdoso").value = idoso ? idoso.nome : "";
    document.getElementById("dataNascimentoIdoso").value = (idoso && idoso.dataNascimento) || "";
    document.getElementById("generoIdoso").value = (idoso && idoso.genero) || "";
    document.getElementById("telefoneIdoso").value = (idoso && idoso.telefone) || "";
    document.getElementById("enderecoIdoso").value = (idoso && idoso.endereco) || "";
    document.getElementById("numeroIdoso").value = (idoso && idoso.numero) || "";
    document.getElementById("bairroIdoso").value = (idoso && idoso.bairro) || "";
    document.getElementById("cidadeIdoso").value = (idoso && idoso.cidade) || "";
    document.getElementById("estadoIdoso").value = (idoso && idoso.estado) || "";
    document.getElementById("cepIdoso").value = (idoso && idoso.cep) || "";
    document.getElementById("mobilidadeIdoso").value = (idoso && idoso.mobilidade) || "";
    definirChips("doencasCronicasIdoso", "listaDoencasCronicas", (idoso && idoso.doencasCronicas) || []);
    definirChips("diagnosticosIdoso", "listaDiagnosticos", (idoso && idoso.diagnosticos) || []);
    definirChips("alergiasIdoso", "listaAlergias", (idoso && idoso.alergias) || []);
    document.getElementById("comidaFavoritaIdoso").value = (idoso && idoso.comidaFavorita) || "";
    document.getElementById("musicaFavoritaIdoso").value = (idoso && idoso.musicaFavorita) || "";
    document.getElementById("hobbiesIdoso").value = (idoso && idoso.hobbies) || "";
    document.getElementById("emergenciaNomeIdoso").value = (idoso && idoso.emergenciaNome) || "";
    document.getElementById("emergenciaTelefoneIdoso").value = (idoso && idoso.emergenciaTelefone) || "";
    document.getElementById("emergenciaParentescoIdoso").value = (idoso && idoso.emergenciaParentesco) || "";
    document.getElementById("notaIdoso").value = (idoso && idoso.nota) || "";

    mostrarTela("formularioIdoso");
    capturarSnapshotFormulario("formularioIdoso");
}

function voltarDoFormularioIdoso() {
    if (idosoEmEdicaoId) {
        voltarParaPerfilIdoso();
    } else {
        mostrarTela("meusIdosos");
    }
}

function salvarIdoso(event) {
    event.preventDefault();

    const dataNascimento = document.getElementById("dataNascimentoIdoso").value;

    const dados = {
        nome: document.getElementById("nomeIdoso").value,
        dataNascimento: dataNascimento,
        idade: String(calcularIdade(dataNascimento)),
        genero: document.getElementById("generoIdoso").value,
        telefone: document.getElementById("telefoneIdoso").value,
        endereco: document.getElementById("enderecoIdoso").value,
        numero: document.getElementById("numeroIdoso").value,
        bairro: document.getElementById("bairroIdoso").value,
        cidade: document.getElementById("cidadeIdoso").value,
        estado: document.getElementById("estadoIdoso").value,
        cep: document.getElementById("cepIdoso").value,
        mobilidade: document.getElementById("mobilidadeIdoso").value,
        doencasCronicas: JSON.parse(document.getElementById("doencasCronicasIdoso").value || "[]"),
        diagnosticos: JSON.parse(document.getElementById("diagnosticosIdoso").value || "[]"),
        alergias: JSON.parse(document.getElementById("alergiasIdoso").value || "[]"),
        comidaFavorita: document.getElementById("comidaFavoritaIdoso").value,
        musicaFavorita: document.getElementById("musicaFavoritaIdoso").value,
        hobbies: document.getElementById("hobbiesIdoso").value,
        emergenciaNome: document.getElementById("emergenciaNomeIdoso").value,
        emergenciaTelefone: document.getElementById("emergenciaTelefoneIdoso").value,
        emergenciaParentesco: document.getElementById("emergenciaParentescoIdoso").value,
        nota: document.getElementById("notaIdoso").value
    };

    if (idosoEmEdicaoId) {
        Object.assign(encontrarIdoso(idosoEmEdicaoId), dados);
    } else {
        idosos.push(Object.assign({
            id: gerarId(),
            criadoEm: Date.now(),
            rotina: [],
            medicamentos: [],
            alimentacao: [],
            consultas: []
        }, dados));
    }

    salvarLista("cuidarplus_idosos", idosos);
    document.getElementById("buscaIdosos").value = "";
    renderizarIdosos();
    renderizarRotinaHoje();

    if (idosoEmEdicaoId) {
        atualizarPerfilIdoso();
        mostrarTela("perfilIdoso");
    } else {
        mostrarTela("meusIdosos");
    }
}

function abrirIdoso(id) {
    idosoAtualId = id;
    atualizarPerfilIdoso();
    mostrarTela("perfilIdoso");
}

function atualizarPerfilIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);

    const avatar = document.getElementById("perfilIdosoAvatar");
    avatar.textContent = iniciais(idoso.nome);
    avatar.style.background = corAvatar(idoso.id);

    document.getElementById("perfilIdosoNome").textContent = idoso.nome;
    let textoIdade = idoso.idade ? idoso.idade + " anos" : "Idade não informada";
    if (idoso.dataNascimento) textoIdade += " (" + formatarData(idoso.dataNascimento) + ")";
    document.getElementById("perfilIdosoIdade").textContent = textoIdade;

    const alergiaEl = document.getElementById("alergiaIdoso");
    const temAlergia = (idoso.alergias || []).length > 0;
    alergiaEl.textContent = temAlergia ? "Alergias: " + idoso.alergias.join(", ") : "";
    alergiaEl.classList.toggle("escondida", !temAlergia);

    const notaEl = document.getElementById("perfilIdosoNota");
    notaEl.textContent = idoso.nota || "";
    notaEl.classList.toggle("escondida", !idoso.nota);

    renderizarInfoExtraIdoso(idoso);

    document.getElementById("resumoRotina").textContent =
        idoso.rotina.length ? idoso.rotina.length + " horário(s) cadastrado(s)" : "Nenhum horário ainda";

    document.getElementById("resumoMedicamentos").textContent =
        idoso.medicamentos.length ? idoso.medicamentos.length + " remédio(s) cadastrado(s)" : "Nenhum remédio ainda";

    document.getElementById("resumoAlimentacao").textContent =
        idoso.alimentacao.length ? idoso.alimentacao.length + " refeição(ões) cadastrada(s)" : "Nenhuma refeição ainda";

    const consultasPendentes = idoso.consultas.filter(function (c) { return c.tipo !== "recorrente" && !c.concluida; });

    if (consultasPendentes.length) {
        const proxima = consultasPendentes.slice().sort(function (a, b) {
            return (a.data + a.horario).localeCompare(b.data + b.horario);
        })[0];
        const prazo = descreverPrazo(diasAteData(proxima.data));
        document.getElementById("resumoConsultas").textContent =
            "Próxima: " + formatarData(proxima.data) + " às " + proxima.horario + " (" + prazo + ")";
    } else if (idoso.consultas.length) {
        document.getElementById("resumoConsultas").textContent = "Nenhuma consulta pendente";
    } else {
        document.getElementById("resumoConsultas").textContent = "Nenhuma consulta ainda";
    }
}

function voltarParaPerfilIdoso() {
    atualizarPerfilIdoso();
    mostrarTela("perfilIdoso");
}

function confirmarExclusaoIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);
    const confirmado = confirm(
        "Tem certeza que deseja excluir " + idoso.nome + "? " +
        "Toda a rotina, medicamentos, alimentação e consultas cadastrados para essa pessoa serão apagados."
    );
    if (!confirmado) return;

    idosos = idosos.filter(function (item) { return item.id !== idosoAtualId; });
    salvarLista("cuidarplus_idosos", idosos);

    idosoAtualId = null;
    document.getElementById("buscaIdosos").value = "";
    renderizarIdosos();
    renderizarRotinaHoje();
    mostrarTela("meusIdosos");
}


// =====================================================
// ROTINA DE CUIDADO
// =====================================================

function abrirRotina() {
    const idoso = encontrarIdoso(idosoAtualId);
    document.getElementById("rotinaSubtitulo").textContent = "Dias e horários de cuidado de " + idoso.nome;
    renderizarRotina();
    mostrarTela("rotinaIdoso");
}

function renderizarRotina() {
    const idoso = encontrarIdoso(idosoAtualId);
    const lista = document.getElementById("listaRotina");

    if (idoso.rotina.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhum horário de cuidado cadastrado ainda.</p>";
        return;
    }

    lista.innerHTML = "";
    const diaHoje = diaAtualAbrev();
    const concluidosHoje = carregarConcluidosHoje();

    idoso.rotina.forEach(function (item) {
        const card = document.createElement("div");
        card.classList.add("rotina-item");
        const chave = "rot-" + idoso.id + "-" + item.id;
        const marcarHoje = item.dias.includes(diaHoje)
            ? "<label class='concluido-hoje'><input type='checkbox' " + (concluidosHoje.includes(chave) ? "checked" : "") + " onchange=\"alternarConcluido('" + chave + "'); renderizarRotina();\"><svg class='icone'><use href='#icone-check'/></svg> Concluído hoje</label>"
            : "";
        card.innerHTML =
            "<h2><span class='card-icone' aria-hidden='true'>" + iconeSvg('relogio') + "</span>" + escaparHtml(item.inicio) + " às " + escaparHtml(item.fim) + "</h2>" +
            "<p>" + formatarDias(item.dias) + "</p>" +
            marcarHoje +
            "<div class='card-acoes'>" +
            "<button class='secundario' onclick=\"abrirFormularioRotina('" + item.id + "')\"><svg class='icone'><use href='#icone-lapis'/></svg> Editar</button>" +
            "<button class='excluir' onclick=\"excluirRotina('" + item.id + "')\"><svg class='icone'><use href='#icone-lixeira'/></svg> Excluir</button>" +
            "</div>";
        lista.appendChild(card);
    });
}

function abrirFormularioRotina(id) {
    const idoso = encontrarIdoso(idosoAtualId);

    if (id) {
        rotinaEmEdicaoId = id;
        const item = idoso.rotina.find(function (r) { return r.id === id; });
        document.getElementById("tituloFormularioRotina").textContent = "Editar rotina";
        document.getElementById("inicioRotina").value = item.inicio;
        document.getElementById("fimRotina").value = item.fim;
        marcarDias("diasRotina", item.dias);
    } else {
        rotinaEmEdicaoId = null;
        document.getElementById("tituloFormularioRotina").textContent = "Adicionar rotina";
        document.getElementById("inicioRotina").value = "";
        document.getElementById("fimRotina").value = "";
        limparDias("diasRotina");
    }

    mostrarTela("formularioRotina");
    capturarSnapshotFormulario("formularioRotina");
}

function salvarRotina(event) {
    event.preventDefault();

    const dias = coletarDias("diasRotina");
    if (dias.length === 0) {
        alert("Selecione ao menos um dia da semana.");
        return;
    }

    const idoso = encontrarIdoso(idosoAtualId);
    const inicio = document.getElementById("inicioRotina").value;
    const fim = document.getElementById("fimRotina").value;

    if (rotinaEmEdicaoId) {
        const item = idoso.rotina.find(function (r) { return r.id === rotinaEmEdicaoId; });
        item.dias = dias;
        item.inicio = inicio;
        item.fim = fim;
    } else {
        idoso.rotina.push({ id: gerarId(), dias: dias, inicio: inicio, fim: fim });
    }
    salvarLista("cuidarplus_idosos", idosos);

    renderizarRotina();
    renderizarRotinaHoje();

    document.getElementById("inicioRotina").value = "";
    document.getElementById("fimRotina").value = "";
    limparDias("diasRotina");
    rotinaEmEdicaoId = null;

    mostrarTela("rotinaIdoso");
}

function excluirRotina(itemId) {
    const idoso = encontrarIdoso(idosoAtualId);
    const item = idoso.rotina.find(function (r) { return r.id === itemId; });
    const confirmado = confirm("Tem certeza que deseja excluir o horário de rotina das " + item.inicio + " às " + item.fim + "?");
    if (!confirmado) return;

    idoso.rotina = idoso.rotina.filter(function (item) { return item.id !== itemId; });
    salvarLista("cuidarplus_idosos", idosos);
    renderizarRotina();
    renderizarRotinaHoje();
}


// =====================================================
// MEDICAMENTOS (por idoso)
// =====================================================

function abrirMedicamentosIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);
    document.getElementById("medicamentosSubtitulo").textContent = "Remédios de " + idoso.nome;
    renderizarMedicamentosIdoso();
    mostrarTela("medicamentosIdoso");
}

function renderizarMedicamentosIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);
    const lista = document.getElementById("listaMedicamentosIdoso");

    if (idoso.medicamentos.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhum medicamento cadastrado ainda.</p>";
        return;
    }

    const ordenados = idoso.medicamentos.slice().sort(function (a, b) {
        return (horariosDoMedicamento(a)[0] || "").localeCompare(horariosDoMedicamento(b)[0] || "");
    });

    lista.innerHTML = "";
    const diaHoje = diaAtualAbrev();
    const concluidosHoje = carregarConcluidosHoje();

    ordenados.forEach(function (item) {
        const card = document.createElement("div");
        card.classList.add("medicamento");
        const horarios = horariosDoMedicamento(item);

        const marcarHoje = item.dias.includes(diaHoje)
            ? horarios.map(function (h) {
                const chave = "med-" + idoso.id + "-" + item.id + "-" + h;
                return "<label class='concluido-hoje'><input type='checkbox' " + (concluidosHoje.includes(chave) ? "checked" : "") + " onchange=\"alternarConcluido('" + chave + "'); renderizarMedicamentosIdoso();\"><svg class='icone'><use href='#icone-check'/></svg> Concluído " + escaparHtml(h) + "</label>";
            }).join("")
            : "";

        card.innerHTML =
            "<h2><span class='card-icone' aria-hidden='true'>" + iconeSvg('comprimido') + "</span>" + escaparHtml(item.nome) + "</h2>" +
            "<p>" + escaparHtml(item.dosagem) + (item.viaAdministracao ? " · " + escaparHtml(item.viaAdministracao) : "") + "</p>" +
            "<p>Horários: <strong>" + horarios.map(escaparHtml).join(", ") + "</strong></p>" +
            "<p>" + formatarDias(item.dias) + "</p>" +
            (item.observacao ? "<p>" + escaparHtml(item.observacao) + "</p>" : "") +
            marcarHoje +
            "<div class='card-acoes'>" +
            "<button class='secundario' onclick=\"abrirFormularioMedicamento('" + item.id + "')\"><svg class='icone'><use href='#icone-lapis'/></svg> Editar</button>" +
            "<button class='excluir' onclick=\"excluirMedicamentoIdoso('" + item.id + "')\"><svg class='icone'><use href='#icone-lixeira'/></svg> Excluir</button>" +
            "</div>";
        lista.appendChild(card);
    });
}

function abrirFormularioMedicamento(id) {
    const idoso = encontrarIdoso(idosoAtualId);

    if (id) {
        medicamentoEmEdicaoId = id;
        const item = idoso.medicamentos.find(function (m) { return m.id === id; });
        document.getElementById("tituloFormularioMedicamento").textContent = "Editar medicamento";
        document.getElementById("nomeMedicamentoIdoso").value = item.nome;
        document.getElementById("dosagemMedicamentoIdoso").value = item.dosagem;
        document.getElementById("viaAdministracaoMedicamento").value = item.viaAdministracao || "";
        document.getElementById("observacaoMedicamento").value = item.observacao || "";
        definirChips("horariosMedicamentoIdoso", "listaHorariosMedicamento", horariosDoMedicamento(item));
        marcarDias("diasMedicamento", item.dias);
    } else {
        medicamentoEmEdicaoId = null;
        document.getElementById("tituloFormularioMedicamento").textContent = "Adicionar medicamento";
        document.getElementById("nomeMedicamentoIdoso").value = "";
        document.getElementById("dosagemMedicamentoIdoso").value = "";
        document.getElementById("viaAdministracaoMedicamento").value = "";
        document.getElementById("observacaoMedicamento").value = "";
        definirChips("horariosMedicamentoIdoso", "listaHorariosMedicamento", []);
        limparDias("diasMedicamento");
    }

    mostrarTela("formularioMedicamentoIdoso");
    capturarSnapshotFormulario("formularioMedicamentoIdoso");
}

function salvarMedicamentoIdoso(event) {
    event.preventDefault();

    const dias = coletarDias("diasMedicamento");
    if (dias.length === 0) {
        alert("Selecione ao menos um dia da semana.");
        return;
    }

    const horarios = JSON.parse(document.getElementById("horariosMedicamentoIdoso").value || "[]").sort();
    if (horarios.length === 0) {
        alert("Adicione ao menos um horário.");
        return;
    }

    const idoso = encontrarIdoso(idosoAtualId);
    const nome = document.getElementById("nomeMedicamentoIdoso").value;
    const dosagem = document.getElementById("dosagemMedicamentoIdoso").value;
    const viaAdministracao = document.getElementById("viaAdministracaoMedicamento").value;
    const observacao = document.getElementById("observacaoMedicamento").value;

    if (medicamentoEmEdicaoId) {
        const item = idoso.medicamentos.find(function (m) { return m.id === medicamentoEmEdicaoId; });
        item.nome = nome;
        item.dosagem = dosagem;
        item.viaAdministracao = viaAdministracao;
        item.observacao = observacao;
        item.horarios = horarios;
        delete item.horario;
        item.dias = dias;
    } else {
        idoso.medicamentos.push({ id: gerarId(), nome: nome, dosagem: dosagem, viaAdministracao: viaAdministracao, observacao: observacao, horarios: horarios, dias: dias });
    }
    salvarLista("cuidarplus_idosos", idosos);

    renderizarMedicamentosIdoso();
    renderizarRotinaHoje();

    document.getElementById("nomeMedicamentoIdoso").value = "";
    document.getElementById("dosagemMedicamentoIdoso").value = "";
    document.getElementById("viaAdministracaoMedicamento").value = "";
    document.getElementById("observacaoMedicamento").value = "";
    definirChips("horariosMedicamentoIdoso", "listaHorariosMedicamento", []);
    limparDias("diasMedicamento");
    medicamentoEmEdicaoId = null;

    mostrarTela("medicamentosIdoso");
}

function excluirMedicamentoIdoso(itemId) {
    const idoso = encontrarIdoso(idosoAtualId);
    const item = idoso.medicamentos.find(function (m) { return m.id === itemId; });
    const confirmado = confirm("Tem certeza que deseja excluir o medicamento \"" + item.nome + "\"?");
    if (!confirmado) return;

    idoso.medicamentos = idoso.medicamentos.filter(function (item) { return item.id !== itemId; });
    salvarLista("cuidarplus_idosos", idosos);
    renderizarMedicamentosIdoso();
    renderizarRotinaHoje();
}


// =====================================================
// ALIMENTAÇÃO (por idoso)
// =====================================================

function abrirAlimentacao() {
    const idoso = encontrarIdoso(idosoAtualId);
    document.getElementById("alimentacaoSubtitulo").textContent = "Refeições de " + idoso.nome;
    renderizarAlimentacao();
    mostrarTela("alimentacaoIdoso");
}

function renderizarAlimentacao() {
    const idoso = encontrarIdoso(idosoAtualId);
    const lista = document.getElementById("listaAlimentacao");

    if (idoso.alimentacao.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhum horário de alimentação cadastrado ainda.</p>";
        return;
    }

    const ordenados = idoso.alimentacao.slice().sort(function (a, b) {
        return a.horario.localeCompare(b.horario);
    });

    lista.innerHTML = "";
    const diaHoje = diaAtualAbrev();
    const concluidosHoje = carregarConcluidosHoje();

    ordenados.forEach(function (item) {
        const card = document.createElement("div");
        card.classList.add("alimentacao-item");
        const chave = "ali-" + idoso.id + "-" + item.id;
        const marcarHoje = item.dias.includes(diaHoje)
            ? "<label class='concluido-hoje'><input type='checkbox' " + (concluidosHoje.includes(chave) ? "checked" : "") + " onchange=\"alternarConcluido('" + chave + "'); renderizarAlimentacao();\"><svg class='icone'><use href='#icone-check'/></svg> Concluído hoje</label>"
            : "";
        card.innerHTML =
            "<h2><span class='card-icone' aria-hidden='true'>" + iconeSvg('prato') + "</span>" + escaparHtml(item.tipo) + "</h2>" +
            "<p>Horário: <strong>" + escaparHtml(item.horario) + "</strong></p>" +
            "<p>" + formatarDias(item.dias) + "</p>" +
            marcarHoje +
            "<div class='card-acoes'>" +
            "<button class='secundario' onclick=\"abrirFormularioAlimentacao('" + item.id + "')\"><svg class='icone'><use href='#icone-lapis'/></svg> Editar</button>" +
            "<button class='excluir' onclick=\"excluirAlimentacao('" + item.id + "')\"><svg class='icone'><use href='#icone-lixeira'/></svg> Excluir</button>" +
            "</div>";
        lista.appendChild(card);
    });
}

function abrirFormularioAlimentacao(id) {
    const idoso = encontrarIdoso(idosoAtualId);

    if (id) {
        alimentacaoEmEdicaoId = id;
        const item = idoso.alimentacao.find(function (a) { return a.id === id; });
        document.getElementById("tituloFormularioAlimentacao").textContent = "Editar alimentação";
        document.getElementById("tipoAlimentacao").value = item.tipo;
        document.getElementById("horarioAlimentacao").value = item.horario;
        marcarDias("diasAlimentacao", item.dias);
    } else {
        alimentacaoEmEdicaoId = null;
        document.getElementById("tituloFormularioAlimentacao").textContent = "Adicionar alimentação";
        document.getElementById("tipoAlimentacao").selectedIndex = 0;
        document.getElementById("horarioAlimentacao").value = "";
        limparDias("diasAlimentacao");
    }

    mostrarTela("formularioAlimentacao");
    capturarSnapshotFormulario("formularioAlimentacao");
}

function salvarAlimentacao(event) {
    event.preventDefault();

    const dias = coletarDias("diasAlimentacao");
    if (dias.length === 0) {
        alert("Selecione ao menos um dia da semana.");
        return;
    }

    const idoso = encontrarIdoso(idosoAtualId);
    const tipo = document.getElementById("tipoAlimentacao").value;
    const horario = document.getElementById("horarioAlimentacao").value;

    if (alimentacaoEmEdicaoId) {
        const item = idoso.alimentacao.find(function (a) { return a.id === alimentacaoEmEdicaoId; });
        item.tipo = tipo;
        item.horario = horario;
        item.dias = dias;
    } else {
        idoso.alimentacao.push({ id: gerarId(), tipo: tipo, horario: horario, dias: dias });
    }
    salvarLista("cuidarplus_idosos", idosos);

    renderizarAlimentacao();
    renderizarRotinaHoje();

    document.getElementById("horarioAlimentacao").value = "";
    limparDias("diasAlimentacao");
    alimentacaoEmEdicaoId = null;

    mostrarTela("alimentacaoIdoso");
}

function excluirAlimentacao(itemId) {
    const idoso = encontrarIdoso(idosoAtualId);
    const item = idoso.alimentacao.find(function (a) { return a.id === itemId; });
    const confirmado = confirm("Tem certeza que deseja excluir o registro de " + item.tipo + "?");
    if (!confirmado) return;

    idoso.alimentacao = idoso.alimentacao.filter(function (item) { return item.id !== itemId; });
    salvarLista("cuidarplus_idosos", idosos);
    renderizarAlimentacao();
    renderizarRotinaHoje();
}


// =====================================================
// CONSULTAS (por idoso)
// =====================================================

function abrirConsultasIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);
    document.getElementById("consultasSubtitulo").textContent = "Consultas de " + idoso.nome;
    renderizarConsultasIdoso();
    mostrarTela("consultasIdoso");
}

function renderizarConsultasIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);
    const lista = document.getElementById("listaConsultasIdoso");
    const verConcluidas = document.getElementById("verConsultasConcluidas").checked;
    const diaHoje = diaAtualAbrev();
    const concluidosHoje = carregarConcluidosHoje();

    const visiveis = idoso.consultas.filter(function (c) {
        if (c.tipo === "recorrente") return true;
        return verConcluidas || !c.concluida;
    });

    if (visiveis.length === 0) {
        lista.innerHTML = "<p class='vazio'>" + (verConcluidas ? "Nenhuma consulta cadastrada ainda." : "Nenhuma consulta pendente.") + "</p>";
        return;
    }

    const unicas = visiveis.filter(function (c) { return c.tipo !== "recorrente"; })
        .sort(function (a, b) { return (a.data + a.horario).localeCompare(b.data + b.horario); });
    const recorrentes = visiveis.filter(function (c) { return c.tipo === "recorrente"; })
        .sort(function (a, b) { return a.horario.localeCompare(b.horario); });
    const ordenadas = unicas.concat(recorrentes);

    lista.innerHTML = "";

    ordenadas.forEach(function (item) {
        const card = document.createElement("div");
        card.classList.add("consulta");
        const recorrente = item.tipo === "recorrente";

        let cabecalho, acaoPrincipal;

        if (recorrente) {
            cabecalho = escaparHtml(item.especialidade || "Consulta") + " às " + escaparHtml(item.horario);
            const chave = "con-" + idoso.id + "-" + item.id;
            acaoPrincipal = item.dias.includes(diaHoje)
                ? "<label class='concluido-hoje'><input type='checkbox' " + (concluidosHoje.includes(chave) ? "checked" : "") + " onchange=\"alternarConcluido('" + chave + "'); renderizarConsultasIdoso();\"><svg class='icone'><use href='#icone-check'/></svg> Concluído hoje</label>"
                : "";
        } else {
            card.classList.toggle("consulta-concluida", !!item.concluida);
            cabecalho = escaparHtml(formatarData(item.data)) + " às " + escaparHtml(item.horario);
            acaoPrincipal = "<div class='card-acoes'>" + (item.concluida
                ? "<button class='secundario' onclick=\"desfazerConclusaoConsulta('" + item.id + "')\"><svg class='icone'><use href='#icone-check'/></svg> Desfazer</button>"
                : "<button class='secundario secundario-sucesso' onclick=\"concluirConsultaIdoso('" + item.id + "')\"><svg class='icone'><use href='#icone-check'/></svg> Concluir</button>") + "</div>";
        }

        card.innerHTML =
            "<h2><span class='card-icone' aria-hidden='true'>" + iconeSvg('calendario') + "</span>" + cabecalho + "</h2>" +
            (item.especialidade && !recorrente ? "<p>" + escaparHtml(item.especialidade) + "</p>" : "") +
            (item.profissional ? "<p>" + escaparHtml(item.profissional) + "</p>" : "") +
            (item.local ? "<p>" + escaparHtml(item.local) + "</p>" : "") +
            (recorrente ? "<p>" + formatarDias(item.dias) + "</p>" : "") +
            acaoPrincipal +
            "<div class='card-acoes'>" +
            "<button class='secundario' onclick=\"abrirFormularioConsulta('" + item.id + "')\"><svg class='icone'><use href='#icone-lapis'/></svg> Editar</button>" +
            "<button class='excluir' onclick=\"excluirConsultaIdoso('" + item.id + "')\"><svg class='icone'><use href='#icone-lixeira'/></svg> Excluir</button>" +
            "</div>";
        lista.appendChild(card);
    });
}

function alternarTipoConsulta() {
    const tipo = document.querySelector('input[name="tipoConsulta"]:checked').value;
    document.getElementById("camposConsultaUnica").classList.toggle("escondida", tipo !== "unica");
    document.getElementById("camposConsultaRecorrente").classList.toggle("escondida", tipo !== "recorrente");
}

function abrirFormularioConsulta(id) {
    const idoso = encontrarIdoso(idosoAtualId);

    if (id) {
        consultaEmEdicaoId = id;
        const item = idoso.consultas.find(function (c) { return c.id === id; });
        const tipo = item.tipo === "recorrente" ? "recorrente" : "unica";
        document.getElementById("tituloFormularioConsulta").textContent = "Editar consulta";
        document.querySelector('input[name="tipoConsulta"][value="' + tipo + '"]').checked = true;
        document.getElementById("especialidadeConsultaIdoso").value = item.especialidade || "";
        document.getElementById("dataConsultaIdoso").value = item.data || "";
        marcarDias("diasConsulta", item.dias || []);
        document.getElementById("horarioConsultaIdoso").value = item.horario;
        document.getElementById("profissionalConsultaIdoso").value = item.profissional || "";
        document.getElementById("localConsultaIdoso").value = item.local || "";
    } else {
        consultaEmEdicaoId = null;
        document.getElementById("tituloFormularioConsulta").textContent = "Adicionar consulta";
        document.querySelector('input[name="tipoConsulta"][value="unica"]').checked = true;
        document.getElementById("especialidadeConsultaIdoso").value = "";
        document.getElementById("dataConsultaIdoso").value = "";
        limparDias("diasConsulta");
        document.getElementById("horarioConsultaIdoso").value = "";
        document.getElementById("profissionalConsultaIdoso").value = "";
        document.getElementById("localConsultaIdoso").value = "";
    }

    alternarTipoConsulta();
    mostrarTela("formularioConsultaIdoso");
    capturarSnapshotFormulario("formularioConsultaIdoso");
}

function salvarConsultaIdoso(event) {
    event.preventDefault();

    const idoso = encontrarIdoso(idosoAtualId);
    const tipo = document.querySelector('input[name="tipoConsulta"]:checked').value;
    const especialidade = document.getElementById("especialidadeConsultaIdoso").value;
    const horario = document.getElementById("horarioConsultaIdoso").value;
    const profissional = document.getElementById("profissionalConsultaIdoso").value;
    const local = document.getElementById("localConsultaIdoso").value;

    let dados;
    if (tipo === "recorrente") {
        const dias = coletarDias("diasConsulta");
        if (dias.length === 0) {
            alert("Selecione ao menos um dia da semana.");
            return;
        }
        dados = { tipo: "recorrente", especialidade: especialidade, dias: dias, horario: horario, profissional: profissional, local: local };
    } else {
        const data = document.getElementById("dataConsultaIdoso").value;
        if (!data) {
            alert("Escolha a data da consulta.");
            return;
        }
        dados = { tipo: "unica", especialidade: especialidade, data: data, horario: horario, profissional: profissional, local: local, concluida: false };
    }

    if (consultaEmEdicaoId) {
        const item = idoso.consultas.find(function (c) { return c.id === consultaEmEdicaoId; });
        const concluidaAnterior = item.concluida;
        delete item.data;
        delete item.dias;
        delete item.concluida;
        Object.assign(item, dados);
        if (tipo === "unica" && concluidaAnterior !== undefined) item.concluida = concluidaAnterior;
    } else {
        idoso.consultas.push(Object.assign({ id: gerarId() }, dados));
    }
    salvarLista("cuidarplus_idosos", idosos);

    renderizarConsultasIdoso();

    document.getElementById("especialidadeConsultaIdoso").value = "";
    document.getElementById("dataConsultaIdoso").value = "";
    limparDias("diasConsulta");
    document.getElementById("horarioConsultaIdoso").value = "";
    document.getElementById("profissionalConsultaIdoso").value = "";
    document.getElementById("localConsultaIdoso").value = "";
    consultaEmEdicaoId = null;

    mostrarTela("consultasIdoso");
}

function concluirConsultaIdoso(itemId) {
    const idoso = encontrarIdoso(idosoAtualId);
    const item = idoso.consultas.find(function (c) { return c.id === itemId; });
    item.concluida = true;
    salvarLista("cuidarplus_idosos", idosos);
    renderizarConsultasIdoso();
}

function desfazerConclusaoConsulta(itemId) {
    const idoso = encontrarIdoso(idosoAtualId);
    const item = idoso.consultas.find(function (c) { return c.id === itemId; });
    item.concluida = false;
    salvarLista("cuidarplus_idosos", idosos);
    renderizarConsultasIdoso();
}

function excluirConsultaIdoso(itemId) {
    const idoso = encontrarIdoso(idosoAtualId);
    const item = idoso.consultas.find(function (c) { return c.id === itemId; });
    const confirmado = confirm("Tem certeza que deseja excluir a consulta do dia " + formatarData(item.data) + "?");
    if (!confirmado) return;

    idoso.consultas = idoso.consultas.filter(function (item) { return item.id !== itemId; });
    salvarLista("cuidarplus_idosos", idosos);
    renderizarConsultasIdoso();
}


// =====================================================
// DASHBOARD — "Sua rotina de hoje" (todos os idosos juntos)
// =====================================================

function dataChaveHoje() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function carregarConcluidosHoje() {
    const dados = localStorage.getItem("cuidarplus_concluidos_" + dataChaveHoje());
    if (!dados) return [];
    try {
        return JSON.parse(dados);
    } catch (erro) {
        return [];
    }
}

function salvarConcluidosHoje(lista) {
    localStorage.setItem("cuidarplus_concluidos_" + dataChaveHoje(), JSON.stringify(lista));
}

function limparConcluidosAntigos() {
    const LIMITE_DIAS = 30;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const chave = localStorage.key(i);
        const match = chave && chave.match(/^cuidarplus_concluidos_(\d{4}-\d{2}-\d{2})$/);
        if (!match) continue;

        const dataChave = new Date(match[1] + "T00:00:00");
        const dias = Math.round((hoje - dataChave) / (1000 * 60 * 60 * 24));
        if (dias > LIMITE_DIAS) {
            localStorage.removeItem(chave);
        }
    }
}

function obterAtividadesHoje() {
    const diaHoje = diaAtualAbrev();
    let atividades = [];

    idosos.forEach(function (idoso) {
        const idosoCor = corAvatar(idoso.id);
        const idosoIniciais = escaparHtml(iniciais(idoso.nome));

        (idoso.medicamentos || []).forEach(function (m) {
            if (m.dias.includes(diaHoje)) {
                horariosDoMedicamento(m).forEach(function (h) {
                    atividades.push({
                        horario: escaparHtml(h), icone: iconeSvg('comprimido'), idosoNome: escaparHtml(idoso.nome),
                        idosoId: idoso.id, idosoCor: idosoCor, idosoIniciais: idosoIniciais,
                        texto: escaparHtml(m.nome + " " + m.dosagem), chave: "med-" + idoso.id + "-" + m.id + "-" + h
                    });
                });
            }
        });
        (idoso.alimentacao || []).forEach(function (a) {
            if (a.dias.includes(diaHoje)) {
                atividades.push({
                    horario: escaparHtml(a.horario), icone: iconeSvg('prato'), idosoNome: escaparHtml(idoso.nome),
                    idosoId: idoso.id, idosoCor: idosoCor, idosoIniciais: idosoIniciais,
                    texto: escaparHtml(a.tipo), chave: "ali-" + idoso.id + "-" + a.id
                });
            }
        });
        (idoso.rotina || []).forEach(function (r) {
            if (r.dias.includes(diaHoje)) {
                atividades.push({
                    horario: escaparHtml(r.inicio), icone: iconeSvg('relogio'), idosoNome: escaparHtml(idoso.nome),
                    idosoId: idoso.id, idosoCor: idosoCor, idosoIniciais: idosoIniciais,
                    texto: "Início do período de cuidado", chave: "rot-" + idoso.id + "-" + r.id
                });
            }
        });
        (idoso.consultas || []).forEach(function (c) {
            if (c.tipo === "recorrente" && c.dias.includes(diaHoje)) {
                atividades.push({
                    horario: escaparHtml(c.horario), icone: iconeSvg('calendario'), idosoNome: escaparHtml(idoso.nome),
                    idosoId: idoso.id, idosoCor: idosoCor, idosoIniciais: idosoIniciais,
                    texto: escaparHtml((c.especialidade || "Consulta") + (c.profissional ? " — " + c.profissional : "")),
                    chave: "con-" + idoso.id + "-" + c.id
                });
            }
        });
    });

    atividades.sort(function (a, b) { return a.horario.localeCompare(b.horario); });
    return atividades;
}

function obterInicioPeriodosHoje() {
    const diaHoje = diaAtualAbrev();
    const itens = [];

    idosos.forEach(function (idoso) {
        const periodosHoje = (idoso.rotina || []).filter(function (r) { return r.dias.includes(diaHoje); });
        if (periodosHoje.length === 0) return;

        const proximo = periodosHoje.slice().sort(function (a, b) { return a.inicio.localeCompare(b.inicio); })[0];
        itens.push({
            idosoId: idoso.id,
            idosoNome: escaparHtml(idoso.nome),
            idosoCor: corAvatar(idoso.id),
            idosoIniciais: escaparHtml(iniciais(idoso.nome)),
            horario: escaparHtml(proximo.inicio),
            chave: "rot-" + idoso.id + "-" + proximo.id
        });
    });

    itens.sort(function (a, b) { return a.horario.localeCompare(b.horario); });
    return itens;
}

function renderizarRotinaHoje() {
    const lista = document.getElementById("listaRotinaHoje");
    const atividadesTotais = obterAtividadesHoje();
    const itens = obterInicioPeriodosHoje();

    if (itens.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhum idoso com período de cuidado hoje. Cadastre a rotina de cada um.</p>";
        atualizarResumoDashboard(atividadesTotais);
        return;
    }

    const concluidos = carregarConcluidosHoje();
    const ocultarConcluidas = document.getElementById("ocultarConcluidas").checked;

    const visiveis = ocultarConcluidas
        ? itens.filter(function (item) { return !concluidos.includes(item.chave); })
        : itens;

    lista.innerHTML = "";

    if (visiveis.length === 0) {
        lista.innerHTML = "<p class='vazio'>Tudo concluído por aqui! 🎉</p>";
        atualizarResumoDashboard(atividadesTotais);
        return;
    }

    visiveis.forEach(function (item) {
        const marcado = concluidos.includes(item.chave);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.classList.add("cartao-inicio-periodo");
        if (marcado) botao.classList.add("atividade-concluida");
        botao.onclick = function () { abrirAgendaIdoso(item.idosoId); };

        botao.innerHTML =
            "<span class='atividade-avatar' aria-hidden='true' style='background:" + item.idosoCor + "'>" + item.idosoIniciais + "</span>" +
            "<span class='atividade-horario'>" + item.horario + "</span>" +
            "<span class='atividade-corpo'><strong>" + item.idosoNome + "</strong>" +
            "<span class='rotina-legenda'>" + iconeSvg('relogio') + " Início do período de cuidado</span></span>";

        lista.appendChild(botao);
    });

    atualizarResumoDashboard(atividadesTotais);
}

function abrirAgendaIdoso(id) {
    idosoAtualId = id;
    const idoso = encontrarIdoso(id);
    document.getElementById("agendaIdosoTitulo").textContent = "Rotina completa de " + idoso.nome;
    renderizarAgendaIdoso();
    mostrarTela("agendaIdoso");
}

function renderizarAgendaIdoso() {
    const idoso = encontrarIdoso(idosoAtualId);
    const lista = document.getElementById("listaAgendaIdoso");
    if (!idoso) return;

    const atividades = obterAtividadesHoje().filter(function (item) { return item.idosoId === idoso.id; });

    if (atividades.length === 0) {
        lista.innerHTML = "<p class='vazio'>Nenhuma atividade cadastrada para hoje.</p>";
        return;
    }

    const concluidos = carregarConcluidosHoje();
    const agora = new Date();
    const horaAtual = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");

    const ordenadas = atividades.slice().sort(function (a, b) {
        const atrasadoA = !concluidos.includes(a.chave) && a.horario < horaAtual;
        const atrasadoB = !concluidos.includes(b.chave) && b.horario < horaAtual;
        if (atrasadoA !== atrasadoB) return atrasadoA ? -1 : 1;
        return a.horario.localeCompare(b.horario);
    });

    lista.innerHTML = "";

    ordenadas.forEach(function (item) {
        const marcado = concluidos.includes(item.chave);
        const atrasado = !marcado && item.horario < horaAtual;

        const linha = document.createElement("label");
        linha.classList.add("atividade");
        if (marcado) linha.classList.add("atividade-concluida");
        if (atrasado) linha.classList.add("atividade-atrasada");

        linha.innerHTML =
            "<input type='checkbox' " + (marcado ? "checked" : "") + " onchange=\"alternarConcluido('" + item.chave + "')\">" +
            "<span class='atividade-horario'>" + item.horario + "</span>" +
            "<span class='atividade-corpo'>" + item.icone + " " + item.texto + "</span>";

        lista.appendChild(linha);
    });
}

function atualizarResumoDashboard(atividades) {
    const concluidos = carregarConcluidosHoje();
    const concluidosValidos = concluidos.filter(function (chave) {
        return atividades.some(function (a) { return a.chave === chave; });
    });

    document.getElementById("statIdosos").textContent = idosos.length;
    document.getElementById("statConcluidas").textContent = concluidosValidos.length + "/" + atividades.length;

    const percentual = atividades.length ? Math.round((concluidosValidos.length / atividades.length) * 100) : 0;
    document.getElementById("barraProgresso").style.width = percentual + "%";
}

function alternarOcultarConcluidas() {
    const marcado = document.getElementById("ocultarConcluidas").checked;
    localStorage.setItem("cuidarplus_ocultar_concluidas", marcado ? "1" : "0");
    renderizarRotinaHoje();
}

function alternarConcluido(chave) {
    let concluidos = carregarConcluidosHoje();
    if (concluidos.includes(chave)) {
        concluidos = concluidos.filter(function (c) { return c !== chave; });
    } else {
        concluidos.push(chave);
    }
    salvarConcluidosHoje(concluidos);
    renderizarRotinaHoje();
    renderizarIdosos();
    renderizarAgendaIdoso();
}

function atualizarSaudacao() {
    const agora = new Date();
    const hora = agora.getHours();

    let saudacao = "Boa noite";
    if (hora >= 5 && hora < 12) saudacao = "Bom dia";
    else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";

    const primeiroNome = (cuidador && cuidador.nome) ? ", " + cuidador.nome.split(" ")[0] : "";
    document.getElementById("saudacaoTitulo").textContent = saudacao + primeiroNome;

    const opcoesData = { weekday: "long", day: "numeric", month: "long" };
    document.getElementById("saudacaoData").textContent = agora.toLocaleDateString("pt-BR", opcoesData);
}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

function iniciarApp() {
    document.getElementById("ocultarConcluidas").checked = localStorage.getItem("cuidarplus_ocultar_concluidas") === "1";
    renderizarIdosos();
    renderizarRotinaHoje();
    atualizarSaudacao();
    mostrarTela("dashboard");
}

function esconderSplash() {
    const splash = document.getElementById("splash");
    splash.classList.add("splash-saindo");
    setTimeout(function () {
        splash.style.display = "none";
    }, 400);
}

document.addEventListener("DOMContentLoaded", function () {
    aplicarTema(document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro");
    aplicarFonte(parseInt(localStorage.getItem("cuidarplus_nivel_fonte") || "0", 10));
    limparConcluidosAntigos();

    if (cuidador) {
        iniciarApp();
    } else {
        mostrarTela("boasVindas");
    }
    setTimeout(esconderSplash, 2300);
});