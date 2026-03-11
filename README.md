# Nuvyon — Inteligência Operacional

> Dashboard de inteligência operacional para gestão de técnicos de campo, agentes SAC e saúde de clientes. Versão **3.1** · 11/03/2026

---

## Visão Geral

O Nuvyon é uma aplicação **single-file** (HTML + CSS + JS) sem dependências de servidor ou banco de dados. Basta abrir o arquivo `index.html` no navegador, carregar os arquivos de dados e o sistema processa tudo localmente, gerando indicadores, scores, rankings e boletins de avaliação em tempo real.

Desenvolvido para a operação da **Nuvyon Telecom**, com foco em reduzir reincidências de campo, monitorar a qualidade do atendimento SAC e fornecer à gestão uma visão consolidada e acionável do negócio.

---

## Funcionalidades

### 6 Abas Operacionais

| Aba | Função |
|---|---|
| 📊 **Gestão Geral** | KPIs globais, ranking de técnicos e visão executiva |
| 🔍 **Visão 360** | Jornada completa do cliente: OS → SAC → AT cruzados |
| 🎧 **Auditoria SAC** | Performance dos agentes de atendimento, alertas e scores |
| 🔧 **Qualidade Técnica** | Indicadores por técnico de campo: reincidência, rapidez, descrições |
| 🩺 **Saúde do Cliente** | Health score por cliente, classificação de risco e ficha individual |
| ⚖️ **Gestor Justo** | Boletim de competências gerado automaticamente por dados reais |

### Ficha do Cliente
- Histórico de OS e atendimentos SAC vinculados por protocolo
- Resumo de técnicos e agentes envolvidos com contagem de atendimentos
- Exportação de Plano de Ação em PDF

### Boletim do Técnico (Gestor Justo)
- Avaliação automática de 4 competências: Adaptabilidade, Comprometimento, Comunicação e Foco em Resultados
- Notas geradas pelos dados reais (editáveis pelo gestor antes da exportação)
- Lógica de penalização: >30% de reincidência = nota 1 automática em Foco em Resultados

---

## Arquivos de Entrada

O sistema aceita até 3 arquivos simultaneamente (`.xlsx`, `.xls` ou `.csv`). Cada arquivo pode ser carregado independentemente — o que não for enviado mantém os dados da sessão anterior.

### Arquivo OS — Ordens de Serviço

Colunas esperadas (nomes flexíveis, o sistema normaliza automaticamente):

| Campo | Variações aceitas |
|---|---|
| Código do cliente | `codigo_cliente`, `cod_cliente` |
| Nome / Razão Social | `nome_razaosocial`, `nome`, `cliente` |
| Tipo da OS | `tipo_ordem_servico`, `tipo_os`, `tipo` |
| Técnico(s) | `tecnicos`, `tecnico`, `técnico`, `nome_tecnico` |
| Data de abertura | `data_abertura`, `data abertura`, `data` |
| Protocolo SAC | `protocolo`, `protocolo_sac`, `num_protocolo` |
| Descrição de fechamento | `descricao_fechamento`, `descricao fechamento` |
| Hora início / término | `hora_inicio_executado`, `hora_termino_executado` |

> **Reincidência** é detectada automaticamente quando `tipo_ordem_servico` contém `REINCID` (case-insensitive).

### Arquivo SAC — Atendimentos SAC

| Campo | Variações aceitas |
|---|---|
| Agente | `Agente`, `agente`, `nome_agente`, `atendente` |
| Protocolo | `Protocolo`, `protocolo`, `num_protocolo` |
| Status | `Status`, `status` |
| Tempo total | `T.Total`, `t_total`, `tempo_total` |
| Data | `Data`, `data` |

> O CSV do SAC **não precisa ter coluna de cliente**. O vínculo é feito por protocolo cruzado com as OS.

### Arquivo AT — Atendimentos (opcional)

Usado como ponte adicional entre OS e SAC quando disponível. O sistema funciona plenamente sem ele.

---

## Fórmulas de Score

```
Score Técnico  = 100 − (taxa_reincidência × 4) − (taxa_genérica × 0.5) − (taxa_rápidas × 0.3)
Score SAC      = (taxa_resolução × 0.4) − (taxa_reincidência × 0.5) − (taxa_transferência × 0.3) + 40
Health Cliente = 100 − (reincidências × 25) − (visitas próximas × 10)
```

Todos os scores são limitados ao intervalo `[0, 100]`.

### Classificação de Técnicos (Flag)

| Flag | Condição |
|---|---|
| ⭐ Elogio | `reincReal = 0` e `taxa_genérica < 20%` |
| ⚠️ Atenção | `taxa_reinc_real > 5%` ou `taxa_r > 4%` |
| 🚨 Alto Risco | `taxa_reinc_real > 10%` ou `taxa_r > 10%` |
| · Normal | demais casos |

### Veredito

| Veredito | Critério |
|---|---|
| **Desligar** | `(taxa_r > 8% e taxa_gen > 30%)` ou `taxa_reinc_real > 15%` |
| **Treinar** | `taxa_r > 4%` ou `taxa_reinc_real > 5%` ou `(taxa_rap > 40% e reinc > 2)` |
| **Manter** | demais casos |

---

## Tecnologias

Todas as dependências são carregadas via CDN — sem instalação, sem build.

| Biblioteca | Uso |
|---|---|
| [SheetJS (XLSX)](https://sheetjs.com/) | Leitura de arquivos `.xlsx` / `.xls` |
| [PapaParse](https://www.papaparse.com/) | Parser de CSV de alto desempenho |
| [Chart.js](https://www.chartjs.org/) | Gráficos de barras, radar e linha |
| [jsPDF](https://github.com/parallax/jsPDF) | Exportação de Plano de Ação em PDF |

---

## Como Usar

1. Faça o download do arquivo `index.html`
2. Abra no navegador (Chrome ou Edge recomendados)
3. Clique em **⬆ Carregar Dados** no canto superior direito
4. Selecione 1, 2 ou os 3 arquivos de dados
5. Clique em **Aplicar** — o processamento é local e imediato

> Nenhum dado é enviado para servidores externos. Tudo roda no navegador.

---

## Estrutura Interna

```
index.html
├── Estilos CSS (tema escuro, variáveis CSS, responsivo)
├── HTML das 6 abas + modais
└── JavaScript (~2.800 linhas)
    ├── STATE          — estado global (rawOS, rawSAC, rawAT, tecnicos, agentes, clientes...)
    ├── processOS()    — parser e análise das OS, cálculo de scores e flags
    ├── processSAC()   — parser SAC com normalização fuzzy de nomes de agentes
    ├── processAT()    — cruzamento OS × SAC via arquivo de atendimentos
    ├── renderAll()    — dispara todos os renders após carga de dados
    ├── openClienteModal() — ficha completa do cliente com cruzamento por protocolo
    ├── openModal()    — boletim de técnico/agente com competências dinâmicas
    └── exportarPlanoAcao() — geração de PDF com dados do cliente
```

### Normalização de Nomes de Agentes SAC

O CSV do SAC frequentemente usa nomes abreviados (ex: `"Felipe"`, `"Eldo M"`). O sistema resolve automaticamente via cascata:

1. **Exato** — correspondência case-insensitive com remoção de acentos
2. **Prefixo** — `"Gabriel"` → `GABRIEL DIVINO NEGRI`
3. **Iniciais de palavras** — `"Eldo M"` → `Eldo Machado`
4. **Substring bidirecional** — `"Rafaella"` → `Rafaella Sarraf Bimonte`

### Cruzamento de Agentes por Cliente

O SAC não contém coluna de cliente. O vínculo é feito em cascata:

1. Coleta protocolos presentes nas OS do cliente
2. Cruza com `STATE.agentes` (cada agente armazena seus protocolos ao processar o SAC)
3. Fallback: varre `rawSAC` filtrando pelos protocolos encontrados
4. Fallback final: busca código/nome do cliente em qualquer coluna do SAC

---

## Histórico de Versões

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | 10/02/2026 | Lançamento inicial com 6 abas, 3 motores de processamento e exportação PDF |
| 1.0 — Fix 1 | 25/02/2026 | Correção: `chartInstances` e `modalData` não declarados (gráficos em branco) |
| 1.0 — Fix 2 | 02/03/2026 | Correção: `renderVisao360` resetava dashboard ao trocar de aba; aba não re-renderizava no `showTab` |
| 1.0 — Fix 3 | 06/03/2026 | Otimização: CSV parser da Visão 360 substituído por PapaParse; loop O(n²) eliminado |
| 1.0 — Fix 4 | 09/03/2026 | Melhoria: Visão 360 reutiliza `STATE.rawOS` automaticamente sem re-importação |
| 3.0 — Fix 1 | 10/03/2026 | Correção: email no footer corrigido; alertas SAC movidos para dentro do card de ranking |
| 3.0 — Fix 2 | 10/03/2026 | Correção: exportação PDF gerava CSV (verificação errada de `window.jspdf.jsPDF`); botão migrado para `data-attributes` |
| 3.0 — Fix 3 | 10/03/2026 | Melhoria: normalização fuzzy de nomes de agentes SAC por prefixo/substring |
| **3.1** | **11/03/2026** | **Cruzamento de agentes por protocolo das OS; boletim do técnico com análise de reincidência até 45 dias e penalização automática por >30% de reincidência** |

---

## Contato

Desenvolvido por **Eng. Erc Jonas**
📧 erj.informatica@gmail.com
