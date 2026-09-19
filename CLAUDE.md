# CLAUDE.md — Contexto do projeto Cuidar+

> Este arquivo existe para que qualquer sessão de IA que trabalhe neste projeto entenda o contexto completo antes de alterar qualquer coisa. Ele foi criado a partir da leitura real de `index.html`, `script.js` e `style.css` — não contém funcionalidades imaginadas ou planejadas que ainda não existem no código.

---

## 1. Objetivo do Cuidar+

O Cuidar+ é um aplicativo web voltado para **cuidadores de idosos**, que centraliza e organiza a rotina de cuidados de **uma ou mais pessoas idosas** sob responsabilidade de um mesmo cuidador — horários de cuidado, medicamentos, alimentação e consultas médicas, tudo em um único lugar.

## 2. Público-alvo

Familiares responsáveis pelo cuidado de idosos e cuidadores profissionais que atendem uma ou mais pessoas idosas simultaneamente.

## 3. Contexto acadêmico

Projeto de extensão (disciplina de extensão, curso de Análise e Desenvolvimento de Sistemas, Universidade da Amazônia, Santarém-PA), com documentação institucional própria (`.docx` modelo PEX-MDL-54) já sincronizada com a arquitetura atual descrita neste arquivo. Autores: Vinícius Sousa dos Santos e Thaís Silva Sousa.

---

## 4. Arquitetura atual (não alterar sem autorização)

```
CUIDADOR
  └── IDOSOS (um cuidador pode ter vários idosos — cada um com dados pessoais, endereço,
      informações médicas, preferências e contato de emergência, além de:)
        ├── ROTINA (dias da semana + horário de início/fim do período de cuidado)
        ├── MEDICAMENTOS (nome, dosagem, via de administração, um ou mais horários, dias da semana)
        ├── ALIMENTAÇÃO (tipo de refeição, horário, dias da semana)
        └── CONSULTAS — única (data + horário) OU recorrente (dias da semana + horário)
```

O Dashboard (tela inicial), na seção "Sua rotina de hoje", mostra **1 cartão por idoso** — só o horário de início do período de cuidado de cada um, ordenado do mais cedo para o mais tarde (2026-09: mudança pedida pelo usuário; antes essa lista misturava rotina + medicamentos + alimentação + consultas de todos os idosos numa lista só, o que confundia quem tinha vários idosos). Clicar no cartão de um idoso abre a tela **"Rotina completa" (`#agendaIdoso`)**, que aí sim agrega, numa lista ordenada por horário (atrasados primeiro), as atividades de **rotina + medicamentos + alimentação + consultas recorrentes** daquele idoso específico para o dia atual — reaproveitando a mesma função `obterAtividadesHoje()` de antes, só que filtrada por `idosoId`. Consultas **únicas** (com data marcada) não entram em nenhuma dessas listas — elas aparecem só na tela de Consultas do idoso e no resumo "Próxima consulta" do perfil. Os cartões de resumo do dashboard (`X idosos`, `Y/Z concluído hoje`) continuam contando **todas** as atividades de todos os idosos, não só as de rotina — não foram afetados por essa mudança.

## 5. Tecnologias utilizadas

- HTML, CSS e JavaScript puro (**sem frameworks, sem build step, sem backend**).
- Persistência 100% local via **localStorage** do navegador.
- Fonte carregada via Google Fonts (`@import` no topo do `style.css`): Atkinson Hyperlegible (títulos e corpo do texto — ver seção 9).
- **jsPDF** (2026-09, `lib/jspdf.umd.min.js`) é a única biblioteca externa do projeto — vendorizada localmente (baixada uma vez, sem CDN, sem gerenciador de pacotes), usada só para montar o PDF do relatório de rotina. Não usa `eval`/`new Function`, então funciona normalmente com o CSP restritivo do projeto (`script-src 'self'`) sem precisar afrouxar nada.
- Ambiente de desenvolvimento: VS Code + extensão Live Server.

## 6. Estrutura dos arquivos (raiz do projeto)

| Arquivo | Função |
|---|---|
| `index.html` | Todas as telas do app (uma por `<section class="tela">`) |
| `style.css` | Todo o visual (variáveis de cor, tipografia, componentes, animações) |
| `script.js` | Toda a lógica: dados, navegação, renderização, localStorage |
| `logo-completa.png` | Ícone + "Cuidar+" (cabeçalho do dashboard) |
| `logo-slogan.png` | Logo completa com slogan (splash e boas-vindas) |
| `favicon-32.png` / `favicon-180.png` | Ícones da aba do navegador / atalho no celular |
| `lib/jspdf.umd.min.js` | Biblioteca jsPDF (vendorizada localmente, build UMD v2.5.2) — única dependência externa do projeto, usada só para gerar o PDF do relatório de rotina (seção 7). Carregada via `<script src="lib/jspdf.umd.min.js">` antes de `script.js`; não precisa de internet nem de build step, é um arquivo estático igual aos outros |
| `logo-icone.png`, `logo-original.jpeg`, `favicon.svg` | Arquivos de origem/rascunho da logo — **não são referenciados no HTML atual**, podem ser mantidos como backup ou removidos, mas não afetam o app funcionando |

Não existe backend, banco de dados externo, `package.json` ou processo de build — são arquivos estáticos abertos diretamente pelo navegador.

---

## 7. Funcionalidades já implementadas (confirmadas no código)

**Tela de abertura (splash):** logo com slogan + barra de progresso animada (~2,3s) antes de mostrar a tela seguinte.

**Primeiro acesso:** formulário de cadastro do cuidador (nome + telefone), exibido apenas se ainda não existe cuidador salvo.

**Dashboard:**
- Saudação dinâmica (Bom dia/Boa tarde/Boa noite + primeiro nome do cuidador) e data por extenso.
- Cartões de resumo: total de idosos cadastrados e progresso do dia (`X/Y concluídas`), com barra de progresso visual.
- Lista "Sua rotina de hoje": **1 cartão por idoso** que tenha período de cuidado programado para hoje (`obterInicioPeriodosHoje()`), mostrando avatar, nome e horário de início, ordenados do mais cedo para o mais tarde. Não é uma lista de tarefas — é um seletor: não tem checkbox, é um botão que leva pra tela "Rotina completa" daquele idoso (`abrirAgendaIdoso`). O checkbox "Ocultar concluídas" acima da lista continua funcionando, só que agora oculta o cartão do idoso cujo início de período já foi marcado como concluído (a marcação em si é feita dentro da tela "Rotina completa" ou na tela de Rotina do próprio idoso, não mais aqui).
- **Tela "Rotina completa" (`#agendaIdoso`)**: aberta ao clicar num cartão da lista acima. Mostra, só daquele idoso, todas as atividades de hoje (rotina + medicamentos + alimentação + consultas recorrentes) numa lista com checkbox, atrasados primeiro — é a mesma lógica/visual que a lista do dashboard tinha antes da mudança de 2026-09, só que filtrada por idoso em vez de misturar todos. Botão "Voltar" leva de volta ao dashboard.
- Atalhos para "Meus idosos" e "Meu perfil" (cuidador).
- Botão de alternar tema claro/escuro (ícone de lua/sol ao lado da logo) — único ponto de acesso ao alternador; o tema escolhido vale pro app inteiro e persiste entre recarregamentos (aplicado antes mesmo da página desenhar, via script no `<head>`, pra não piscar o tema errado).
- Botão **"Baixar relatório"** abaixo da lista (`abrirModalRelatorio()`) — substituiu completamente o antigo "Imprimir rotina de hoje" (2026-09, pedido do usuário: `window.print()` e o `@media print` de `style.css` foram removidos, não existem mais). Abre o modal `#modalRelatorio` (reaproveita a mesma estrutura visual do `#modalSobre`) com duas escolhas — **Período** (Diário / Semanal / Mensal, radio) e **Idoso** (select, "Todos os idosos" + um por idoso cadastrado) — e um botão que gera e baixa um PDF de verdade (não é captura de tela):
  - `gerarRelatorioPDF(periodo, idosoIdOuTodos)` em `script.js` monta o PDF do zero com a biblioteca `jsPDF` (ver seção 5), usando só `doc.text()`/`doc.rect()`/`doc.line()` — sem plugin de tabela, as "tabelas" e listas são desenhadas manualmente.
  - **Diário**: tabela com colunas Horário / Atividade / Observação para o dia atual. **Semanal**: agrupado por dia (segunda a domingo da semana atual) com os horários do dia em lista. **Mensal**: mesma lista, mas para todos os dias do mês atual — pode gerar várias páginas (numeração automática no rodapé: "Página X de Y").
  - Com **"Todos os idosos"**, o relatório é agrupado primeiro por idoso (nome em destaque + linha separadora) e, dentro de cada um, pelo formato do período escolhido — nunca mistura atividades de idosos diferentes sem identificar a quem pertencem.
  - Os dados vêm de `obterAtividadesParaData(dataObj, idoso)` — uma versão de `obterAtividadesHoje()` generalizada para qualquer data (não só hoje), reaproveitando os mesmos campos já cadastrados (rotina, medicamentos com `horariosDoMedicamento()`, alimentação, consultas únicas por `data` exata e recorrentes por dia da semana). Não inclui status de concluído/atrasado — o app não guarda esse histórico para dias além do atual (ver seção 8), então o relatório é sempre "o que está agendado", não "o que foi feito".
  - Nome do arquivo gerado automaticamente: `Cuidar+_Relatorio_Rotina_<Nome_do_idoso ou Todos>_<DD-MM-AAAA>.pdf` (data = dia em que o relatório foi gerado), via `sanitizarNomeArquivo()` (remove acentos e espaços).
- Ícone de menu hambúrguer (☰) no canto superior esquerdo, ao lado oposto do botão de tema. Abre o **menu lateral** (ver abaixo).

**Menu lateral (hambúrguer)** — adicionado em 2026-09, por pedido do usuário, pra tirar os controles de tamanho de fonte do meio da tela principal e agrupar acessibilidade + informações do app num só lugar:
- Aberto/fechado por `alternarMenuLateral()` (`#menuLateral` + `#overlayMenu`, ambos fixos, deslizando da esquerda com `transform`). Fecha ao clicar de novo no ☰, no X do cabeçalho do menu, ou no overlay escuro atrás dele (`fecharMenuLateral()`).
- Seção **Acessibilidade**: "Aumentar fonte" e "Diminuir fonte" (mesmas `aumentarFonte()`/`diminuirFonte()` de sempre — só mudaram de lugar, saíram do topo do dashboard) e "Restaurar tamanho padrão" (`restaurarFonte()`, novo — volta direto pro nível 0/100%, mesma variável `--zoom-conteudo` e mesma chave `cuidarplus_nivel_fonte` no localStorage).
- Seção **Como usar**: botão "Como usar o Cuidar+" (`abrirComoUsar()`) fecha o menu lateral e abre a tela `#comoUsar` — um guia com um cartão por função (mesmo visual de `.cartao-info`, com um `.card-icone` colorido por categoria em cada `<h2>`), escrito para quem está usando o app pela primeira vez: 1) cadastrar/acessar um idoso, 2) ver a rotina do dia (cartão por idoso + rotina completa), 3) medicamentos, 4) consultas, 5) alimentação, 6) contato de emergência (deixa explícito que não existe uma lista de contatos separada, só esse campo dentro do cadastro do idoso — pra não prometer uma função que não existe) e 7) baixar relatório (2026-09, adicionado quando essa função foi criada). Botão "Voltar" leva pro dashboard.
- Seção **Sobre**: botão "Sobre o Cuidar+" (`abrirSobre()`) fecha o menu lateral e abre um modal fixo centralizado (`#modalSobre` + `#overlaySobre`) com um texto curto sobre o app e o aviso de privacidade (dados só no dispositivo); fecha pelo X ou clicando fora (`fecharSobre()`).
- O menu **não** tem "Perfil" nem "Configurações" — Perfil continua acessível só pelo atalho "Meu perfil" no fim do dashboard (decisão explícita do usuário, pra não duplicar o acesso); Configurações não existe porque o app não tem nada configurável além do que já está no menu.
- Esses elementos (`#menuLateral`, `#overlayMenu`, `#modalSobre`, `#overlaySobre`) ficam fora da `<main class="app">`, como filhos diretos do `<body>`, pra não sofrer o `zoom` do ajuste de fonte nem depender de qual tela (`.tela`) está visível — funcionam em cima de qualquer tela do app, embora hoje só sejam abertos a partir do dashboard. `#comoUsar` já é uma `.tela` normal (como as demais do app), então segue a mesma lógica de `mostrarTela()`.
- **Regra pra manter esse guia atualizado**: sempre que uma função nova for adicionada ao app (ou uma existente mudar de lugar/comportamento), atualizar também o cartão correspondente em `#comoUsar` — é fácil esquecer, já que o guia não é a tela mais usada do app, mas ele fica desatualizado (e confunde iniciantes) se ninguém lembrar de revisá-lo a cada mudança.

**Meus idosos:** lista ordenada por urgência (quem tem algo atrasado hoje vem primeiro) e, dentro de cada grupo, por nome. Tem campo de busca (só aparece se houver idosos cadastrados), avatar colorido (iniciais do nome, cor calculada por hash do ID a partir de uma paleta de 6 cores) e resumo com contagem de itens pendentes por categoria (ícones SVG próprios — ver seção 9). Se o idoso tem algum medicamento/alimentação/rotina/consulta recorrente de hoje já atrasado e não concluído, aparece um aviso "Atrasado hoje" em vermelho (`idosoTemAtrasoHoje`) antes do resumo. Botão para adicionar novo idoso.

Essa lista é recalculada (`renderizarIdosos()`) sempre que algo é marcado/desmarcado como concluído em qualquer tela — `alternarConcluido()` chama tanto `renderizarRotinaHoje()` (dashboard) quanto `renderizarIdosos()` (Meus idosos), pra garantir que o aviso "Atrasado hoje" some imediatamente quando a pendência é resolvida, mesmo sem recarregar a página.

**Cadastro/edição de idoso:** nome, data de nascimento (idade é **calculada automaticamente** por `calcularIdade()`, não digitada — o campo `idade` continua existindo no objeto salvo, só que preenchido sozinho, pra não quebrar nada que já lia esse campo), gênero, telefone — todos exceto nome e nascimento são opcionais. Depois vem **Endereço** (rua, número, bairro, cidade, estado, CEP), **Informações médicas** (mobilidade em select; doenças crônicas, diagnósticos e alergias como listas de "chips" removíveis — ver `adicionarChip`/`removerChip`/`renderizarChips` em `script.js`, que guardam a lista como JSON dentro de um `<input type="hidden">`), **Preferências e hábitos** (comida/música favoritas, hobbies) e **Contato de emergência** (nome, telefone, parentesco — funcionalidade que tinha sido removida do escopo e foi **reintroduzida por pedido explícito do usuário**). Por fim, "Outras observações" (o antigo campo único de texto livre, mantido para qualquer coisa que não se encaixe nos campos estruturados). Tudo isso é opcional exceto nome e data de nascimento. Mesmo formulário serve para criar e editar (`idosoEmEdicaoId`); dados antigos sem os campos novos continuam funcionando normalmente (campos ausentes simplesmente não aparecem em lugar nenhum).

**Perfil do idoso**, nesta ordem (reorganizado em 2026-09 — o menu de ações estava enterrado embaixo de 5 cartões de dados cadastrais, o que atrapalhava o uso diário):
1. Avatar grande + nome + idade "(DD/MM/AAAA)".
2. **Alerta de alergias** (`#alergiaIdoso`, classe `.alerta-alergia`) — vermelho, negrito, só aparece se o idoso tiver alguma alergia cadastrada. Fica logo abaixo do nome, de propósito: é a informação de segurança mais crítica da tela, não pode se perder no meio de "hobbies favoritos". Os chips de alergia no formulário também são vermelhos (`.chip-perigo`, aplicado em `renderizarChips` quando `containerId === "listaAlergias"`), consistente com o alerta.
3. Observação livre (se houver).
4. 4 atalhos (Rotina, Medicamentos, Alimentação, Consultas) — o que o cuidador mais usa no dia a dia vem primeiro, não depois de uma pilha de dados que raramente mudam.
5. Cartões de informação cadastral (`renderizarInfoExtraIdoso` monta isso dinamicamente em `#infoExtraIdoso` — um cartão só aparece se tiver pelo menos um campo daquela categoria preenchido): Dados pessoais, Endereço, Informações médicas (mobilidade/doenças/diagnósticos — alergias saiu daqui, já tem o alerta próprio acima), Preferências, Contato de emergência.
6. Botões para editar dados do idoso ou excluí-lo (com `confirm()` antes de apagar).

**Rotina de cuidado:** dias da semana + horário de início/fim. CRUD completo (criar, listar, excluir).

**Medicamentos:** nome, dosagem, via de administração (opcional), **um ou mais horários** (lista de chips — remédio tomado 3x ao dia é 1 cadastro só, com 3 horários, não 3 cadastros separados), dias da semana, observação (opcional). CRUD completo. O campo `horarios` (array) substitui o antigo `horario` (string única); `horariosDoMedicamento(item)` lê os dois formatos, então remédios cadastrados antes dessa mudança continuam funcionando sem precisar editar nada. No dashboard e no checklist "Concluído hoje", cada horário do mesmo remédio é uma linha/checkbox independente (chave `med-<idosoId>-<itemId>-<horário>`).

**Alimentação:** tipo de refeição (select com 6 opções fixas: Café da manhã, Lanche, Almoço, Café da tarde, Jantar, Ceia), horário, dias da semana. CRUD completo.

Rotina, Medicamentos e Alimentação mostram um checkbox "Concluído hoje" em cada item — mas só quando esse item está programado para o dia da semana atual. Esse checkbox usa a mesma chave/lista (`cuidarplus_concluidos_YYYY-MM-DD`) que a lista "Sua rotina de hoje" do dashboard, então marcar num lugar reflete no outro automaticamente.

**Consultas:** dois tipos, escolhidos por rádio no formulário (`tipoConsulta`, campo `tipo` no objeto salvo):
- **Única** (`tipo: "unica"`, padrão): data + horário, especialidade (opcional), profissional (opcional), local (opcional). Some da lista quando marcada como concluída (botão "Concluir"/"Desfazer", igual antes), sem apagar o registro. Um alternador "Ver concluídas" no topo da lista mostra as concluídas de volta (título riscado). Entra no resumo "Próxima consulta" do perfil do idoso; **não** entra na lista "Sua rotina de hoje" do dashboard (comportamento antigo, mantido).
- **Recorrente** (`tipo: "recorrente"`): especialidade + dias da semana + horário, profissional/local opcionais. Não tem `data` nem `concluida` — funciona como Rotina/Medicamentos/Alimentação: aparece todo dia em que está programada, com checkbox "Concluído hoje" (mesma chave `cuidarplus_concluidos_YYYY-MM-DD`, formato `con-<idosoId>-<itemId>`), e **entra** na lista "Sua rotina de hoje" do dashboard quando cai no dia da semana atual. Não entra no resumo "Próxima consulta" (não tem uma "próxima data" — é recorrente).

CRUD completo pros dois tipos, mesmo formulário (`alternarTipoConsulta()` mostra/esconde os campos certos). Editar uma consulta trocando o tipo limpa os campos do tipo anterior (não fica com `data` e `dias` juntos no mesmo registro).

**Aviso de alterações não salvas:** todos os formulários (idoso, rotina, medicamento, alimentação, consulta, cuidador) guardam um retrato dos campos ao abrir (`capturarSnapshotFormulario`). Se o botão "← Voltar" for clicado com algo diferente desse retrato, aparece um `confirm()` perguntando se quer sair sem salvar; cancelando, o formulário continua aberto com os dados intactos. Sem nenhuma alteração, "Voltar" sai direto, sem perguntar nada.

**Seletor de dias da semana:** usado em Rotina, Medicamentos e Alimentação. Tem um checkbox extra "Todos os dias" que marca/desmarca os 7 dias de uma vez e se mantém sincronizado com a seleção manual (`alternarTodosDias` / `sincronizarTodos`).

**Perfil do cuidador:** visualizar e editar nome/telefone. Também tem o botão **"Apagar todos os dados"** (`apagarTodosDados()`) — apaga literalmente tudo (`localStorage.clear()`: cuidador, todos os idosos, preferências de tema/fonte/etc.) e recarrega a página, voltando pro primeiro acesso. É a única forma de "resetar" o app sem mexer direto no navegador. Pede **duas confirmações seguidas** (mais que o padrão de uma só usado em "Excluir idoso"), porque apaga tudo de uma vez, não só um idoso — a primeira mensagem já avisa quantos idosos serão perdidos.

**Identidade visual:** paleta de cores por categoria (ver seção 9), tipografia única Atkinson Hyperlegible (ver seção 9), logo oficial em 3 recortes, animações leves (fade ao trocar de tela, resposta ao toque em botões/cartões), favicon a partir da logo real, `prefers-reduced-motion` respeitado.

## 8. Estrutura dos dados e localStorage

```js
// chave: "cuidarplus_cuidador"
{ nome: string, telefone: string }

// chave: "cuidarplus_idosos" — array de:
{
  id: string,           // gerado por gerarId() = timestamp + random em base36
  criadoEm: number,     // Date.now() no momento do cadastro (idosos antigos não têm esse campo)
  nome: string,
  dataNascimento: string, // "YYYY-MM-DD" (idosos antigos podem não ter)
  idade: string,        // calculada automaticamente a partir de dataNascimento (calcularIdade())
  genero: string,       // opcional, pode ser ""
  telefone: string,     // opcional, pode ser ""
  endereco, numero, bairro, cidade, estado, cep: string, // todos opcionais, podem ser ""
  mobilidade: string,   // opcional, pode ser ""
  doencasCronicas: string[], // lista de chips, pode ser []
  diagnosticos: string[],    // lista de chips, pode ser []
  alergias: string[],        // lista de chips, pode ser []
  comidaFavorita, musicaFavorita, hobbies: string, // todos opcionais, podem ser ""
  emergenciaNome, emergenciaTelefone, emergenciaParentesco: string, // todos opcionais, podem ser ""
  nota: string,         // opcional, pode ser "" — outras observações livres, não cobertas pelos campos acima
  rotina:       [{ id, dias: ["seg","ter",...], inicio: "HH:MM", fim: "HH:MM" }],
  medicamentos: [{ id, nome, dosagem, viaAdministracao, observacao, horarios: ["HH:MM", ...], dias: [...] }],
                // horarios substitui o antigo horario (string única) — horariosDoMedicamento(item) lê os dois formatos
  alimentacao:  [{ id, tipo, horario: "HH:MM", dias: [...] }],
  consultas:    [
    // única (tipo padrão se o campo tipo estiver ausente, p/ registros antigos):
    { id, tipo: "unica", data: "YYYY-MM-DD", horario: "HH:MM", especialidade, profissional, local, concluida: boolean },
    // recorrente:
    { id, tipo: "recorrente", especialidade, dias: ["seg","ter",...], horario: "HH:MM", profissional, local }
  ]
}

// chave: "cuidarplus_concluidos_YYYY-MM-DD" — array de strings tipo:
// "med-<idosoId>-<itemId>-<horario>", "ali-<idosoId>-<itemId>", "rot-<idosoId>-<itemId>", "con-<idosoId>-<itemId>" (só consultas recorrentes)

// chave: "cuidarplus_ocultar_concluidas" — "1" ou "0"
// preferência do alternador "Ocultar concluídas" do dashboard, persiste entre recarregamentos

// chave: "cuidarplus_tema" — "claro" ou "escuro"
// preferência do botão de tema (dashboard, ao lado da logo), persiste entre recarregamentos
```

Não há histórico permanente de itens concluídos — cada dia gera sua própria chave no localStorage. Chaves com mais de 30 dias são apagadas automaticamente ao abrir o app (`limparConcluidosAntigos()`, chamada no `DOMContentLoaded`) — isso é só limpeza de armazenamento, não um histórico consultável pelo usuário.

## 9. Identidade visual (preservar)

**Cores** (definidas como variáveis CSS em `:root`):
| Uso | Variável | Cor |
|---|---|---|
| Primária / Medicamentos | `--cor-primaria` | `#2F6F62` |
| Primária escura | `--cor-primaria-escura` | `#234F45` |
| Rotina | `--cor-rotina` | `#35618C` |
| Alimentação | `--cor-alimentacao` | `#BF6B3D` |
| Consultas | `--cor-consulta` | `#B9791F` |
| Perigo/excluir | `--cor-perigo` | `#D8482E` |
| Fundo geral | `--cor-fundo` | `#F5F6F5` |
| Menta (gradiente do hero) | `--cor-primaria-menta` | `#6FBFA0` |

O gradiente do cartão de saudação do dashboard (`.saudacao`) vai de `--cor-primaria-escura` a `--cor-primaria-menta`, ecoando o degradê real da logo. Títulos estruturais (`h1`, `.secao-titulo`, nome do idoso no perfil) usam `--cor-texto` (tinta neutra), não mais a cor de marca — a cor de marca fica reservada para o hero, ícones e elementos interativos. Números de destaque (`.stat-numero`) continuam na cor de marca, de propósito.

**Raio de borda:** sistema de 3 variáveis — `--raio-sm` (8px, controles de formulário e chips pequenos), `--raio-md` (10px, cartões de conteúdo e botões secundários), `--raio-lg` (14px, grandes alvos de toque como itens de menu e cartão de idoso). Valores reduzidos deliberadamente (eram 10/14/20px) para um visual menos "arredondado/infantil". Barras de progresso usam `999px` (pílula) e avatares usam `50%` (círculo), fora desse sistema.

**Tipografia:** só `Atkinson Hyperlegible` (400 e 700), em títulos e corpo. A fonte serifada `Fraunces` foi removida em 2026-09 — o par serifada+sans lia como "cartão de felicitações", pouco profissional. `--fonte-display` aponta pra `Atkinson Hyperlegible` também (não para uma fonte diferente), então títulos usam a mesma família, só maiores e em peso 700. Não reintroduzir uma segunda família sem necessidade real — o pedido do usuário foi explicitamente por um visual "menos infantil, mais profissional".

**Ícones:** não usa emoji — usa um sprite de ícones SVG próprios (`<symbol>`) declarado no topo do `index.html` (relógio, comprimido, prato, calendário, pessoas, pessoa, lápis, lixeira, check), reutilizados via `<svg class="icone"><use href="#icone-nome"/></svg>` (ou pela função `iconeSvg(nome)` em `script.js`). Os chips de ícone (`.menu-icone`, `.card-icone`) usam fundo **sólido** na cor da categoria com ícone branco (não mais fundo pastel claro com ícone colorido) — contraste mais forte, lê como selo/badge de app profissional em vez de bloco pastel suave.

**Botões de ação em cartões:** Editar/Excluir (e Concluir, em consultas) ficam lado a lado dentro de um `<div class="card-acoes">` (flex, 50% cada), não mais empilhados em largura total — cartões de lista ficam mais compactos. Testado responsivo de 320px a 1440px sem quebra.

**Tema claro/escuro:** implementado via atributo `data-tema="escuro"` na tag `<html>` — um bloco `:root[data-tema="escuro"]` em `style.css` redefine as variáveis de cor (fundo, superfície, texto, bordas e as cores de categoria, que ficam mais claras/vivas pra manter contraste num fundo escuro). `--cor-primaria-escura` e `--cor-primaria-menta` não mudam entre temas de propósito (só compõem o gradiente do hero, que já funciona sozinho nos dois fundos). As variáveis `--cor-<categoria>-clara` (exceto `--cor-primaria-clara` e `--cor-perigo-clara`, que ainda são usadas) foram removidas por não terem mais uso depois que os chips de ícone passaram a fundo sólido. O botão fica no dashboard, ao lado da logo (`.botao-tema`), alterna via `alternarTema()` em `script.js`, e um script no `<head>` do `index.html` aplica a preferência salva antes da página desenhar, evitando flash do tema errado.

**Logo:** fornecida pelo usuário — dois personagens formando um coração em gradiente verde-teal, com o slogan "cuidado que conecta, carinho que acompanha".

**Avatares dos idosos:** círculo colorido com iniciais do nome, cor escolhida automaticamente (hash do ID sobre uma paleta de 6 cores).

---

## 10. Regras de desenvolvimento (seguir sempre)

1. Não remover funcionalidades existentes sem autorização do usuário.
2. Não alterar a arquitetura do projeto (Cuidador → Idosos → Rotina/Medicamentos/Alimentação/Consultas) sem autorização.
3. Não trocar as tecnologias utilizadas (HTML/CSS/JS puro, localStorage) sem autorização.
4. Não adicionar backend ou banco de dados externo sem o usuário solicitar.
5. Não reescrever grandes partes do projeto sem necessidade — preferir edições pontuais.
6. Preservar a identidade visual existente (cores, fontes, logo, estilo dos componentes).
7. Analisar o código existente antes de implementar qualquer funcionalidade nova.
8. Evitar soluções desnecessariamente complexas — priorizar o que é simples de manter.
9. O usuário é iniciante em programação — explicar as alterações de forma simples, sem jargão técnico desnecessário.
10. Antes de alterações grandes ou que afetem várias funcionalidades ao mesmo tempo, explicar o plano antes de executar.
11. Sempre que possível, verificar se as alterações funcionam corretamente antes de entregar (checagem de sintaxe, IDs/funções referenciados, etc.).

## 11. Funcionalidades removidas do escopo (não reintroduzir sem autorização)

- **Contatos** (lista geral de contatos importantes/familiares, telas dedicadas) — continua fora do escopo.
- ~~**Emergência**~~ — **reintroduzida em 2026-09, por pedido explícito do usuário**, mas de forma pontual: só um grupo de 3 campos opcionais (nome, telefone, parentesco) dentro do cadastro do idoso, exibido como um cartão "Contato de emergência" no perfil quando preenchido. Não é uma tela/aba dedicada, não tem lógica própria (é só mais um bloco de dados do idoso).

Essas duas existiram em uma versão anterior do projeto (quando o app era pensado para o próprio idoso usar) e foram deliberadamente removidas no pivô para a arquitetura Cuidador → Idosos. "Contatos" (a lista geral) continua removida — só o contato de emergência específico voltou.

## 12. Funcionalidades futuras (NÃO são funcionalidades atuais)

- Lembretes/notificações automáticas de horário de remédio.
- Transformar o app em PWA instalável no celular.
- Aba de comunicação entre cuidadores.
- Histórico permanente de itens marcados como concluídos (hoje só existe o controle do dia atual).
- Incluir consultas **únicas** (com data marcada) na lista agregada "Sua rotina de hoje" do dashboard — desde 2026-09 as consultas **recorrentes** já entram nessa lista (se comportam como Rotina); só as de data única continuam de fora.
- Exportar/importar dados (backup manual em `.json`) — ideia levantada numa análise anterior, ainda não implementada.

## 13. Segurança (revisão feita em 2026-09)

**Escape de HTML:** toda vez que um dado que o usuário digitou é colocado na tela via `innerHTML`, ele passa por `escaparHtml()` antes — inclui nome, idade, dosagem, médico, local, tipo de refeição, horários, datas. Campos que só preenchem um formulário para edição (`.value = ...`) **não** são escapados de propósito, porque isso é atribuição direta e não interpretação de HTML — escapar ali faria aparecer `&amp;` literal ao reabrir pra editar. Se adicionar um novo campo que aparece na tela, sempre usar `escaparHtml()` (ou `textContent`, que já escapa sozinho) antes de colocar em `innerHTML`.

**Carregamento do localStorage protegido:** `carregarLista()`, `carregarCuidador()` e `carregarConcluidosHoje()` fazem `JSON.parse` dentro de `try/catch`, retornando lista vazia/`null` se o dado estiver corrompido, em vez de travar o app inteiro.

**Content-Security-Policy:** `index.html` tem uma tag `<meta http-equiv="Content-Security-Policy">` restringindo de onde scripts/estilos/fontes/imagens podem carregar (só o próprio site + Google Fonts). Ela inclui `'unsafe-inline'` em `script-src` e `style-src` porque o app usa `onclick="..."` e `style="background:..."` inline em várias partes — sem isso o app inteiro pararia de funcionar. Ou seja, o CSP bloqueia carregar recursos de outros sites, mas não impede a execução de um script inline se um dia uma injeção conseguir passar pelo escape acima — as duas camadas trabalham juntas, nenhuma sozinha é suficiente.

**Fora de escopo dessa revisão (decisões de arquitetura, não bugs):** os dados ficam em texto puro no localStorage, sem criptografia nem PIN — qualquer um com acesso ao aparelho desbloqueado ou a uma extensão de navegador com permissão ampla no site consegue ler tudo. A fonte é carregada de `fonts.googleapis.com` (CDN do Google), que recebe o IP de quem acessa o app. Nenhuma das duas coisas foi alterada — mudar exigiria decisão do usuário (ex: adicionar autenticação local, ou baixar a fonte pra servir localmente).
