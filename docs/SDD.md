# SDD — Cartório Digital de CPF
### Software Design Document · Foco em Design de Produto, Motion & Motion-Design

| Campo | Valor |
|---|---|
| **Projeto** | Cartório Digital de CPF ("Selo") |
| **Versão do documento** | 1.0.0 (SDD) |
| **Status** | Aprovado para implementação |
| **Data** | 19/10/2026 |
| **Autor** | Equipe de Design & Front-end |
| **Stack alvo** | Vite + React 18 + TypeScript + Motion (framer-motion) + Three.js |
| **Documentos relacionados** | `docs/SDD.md` (este), `README.md`, `docs/DESIGN-TOKENS.md` |

> **Lei de leitura deste documento.** As seções marcadas com `MUST` são requisitos contratuais de implementação. As marcadas com `SHOULD` são forte recomendação. As marcadas com `MAY` são opções criativas com degradação elegante. Nenhuma seção é decorativa: **todo valor aqui é rastreável até código, token ou teste.**

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Visão do Produto](#2-visão-do-produto)
3. [Metas e Não-Metas](#3-metas-e-não-metas)
4. [Personas e Histórias de Usuário](#4-personas-e-histórias-de-usuário)
5. [Princípios de Design](#5-princípios-de-design)
6. [Linguagem Visual](#6-linguagem-visual)
7. [Sistema de Motion](#7-sistema-de-motion)
8. [Coreografia do Carimbo](#8-coreografia-do-carimbo-o-heartbeat-do-produto)
9. [Layout, Grade e Responsividade](#9-layout-grade-e-responsividade)
10. [Especificação de Telas](#10-especificação-de-telas)
11. [Especificação da Cena 3D (Three.js)](#11-especificação-da-cena-3d-threejs)
12. [Sistema de Parallax](#12-sistema-de-parallax)
13. [Especificação do Algoritmo de CPF](#13-especificação-do-algoritmo-de-cpf)
14. [Inventário de Componentes](#14-inventário-de-componentes)
15. [Acessibilidade](#15-acessibilidade-wcag-22-aa)
16. [Performance e Orçamento](#16-performance-e-orçamento-de-frames)
17. [Arquitetura Técnica](#17-arquitetura-técnica)
18. [Modelo de Dados e Persistência](#18-modelo-de-dados-e-persistência)
19. [Tratamento de Erros e Casos Limite](#19-tratamento-de-erros-e-casos-limite)
20. [Plano de Testes](#20-plano-de-testes)
21. [Deployment](#21-deployment)
22. [Critérios de Aceitação](#22-critérios-de-aceitação)
23. [Riscos e Mitigações](#23-riscos-e-mitigações)
24. [Roadmap](#24-roadmap)
25. [Apêndices](#25-apêndices)

---
## 1. Resumo Executivo

O **Cartório Digital de CPF** é uma aplicação web single-page cujo propósito único é **validar um CPF brasileiro e comunicar o resultado com impacto visual inequívoco**. A tese de produto é simples: *um CPF não é um campo de texto — é um documento oficial, e documentos oficiais recebem carimbo*.

O diferencial não está no algoritmo de validação (que é trivial e determinístico), mas na **encenação do resultado**:

- Um **carimbo de cartório** físico — com tinta granulada, bordas irregulares, textura de papel e leve inclinação — é estampado sobre o CPF digitado.
- O carimbo **cai com impacto** (squash & stretch), faz a tela tremer, e um **halo de tinta** se espalha.
- O resultado é ambíguo por natureza: um carimbo "BLOQUEADO/INVÁLIDO" ou um "SELO DE CONFORMIDADE/VÁLIDO".
- O ambiente é uma **mesa de cartório 3D** (Three.js) com papel texturizado, luz volumétrica rasante e partículas de poeira em suspensão, reagindo à **parallax** do cursor.

A experiência é construída em **duas dimensões simultâneas**:

1. **Camada 2D (Motion + DOM/SVG)** — a coreografia do carimbo, que carrega o peso emocional e a legibilidade.
2. **Camada 3D (Three.js/WebGL)** — a mesa, o papel, a luz e a poeira, que construem o "chão" da experiência e reagem à interação.

A camada 3D é **estética e responsiva**; a camada 2D é **semântica e funcional**. Essa separação é a regra arquitetural central do projeto.

### 1.1 A Questão do CPF Sequencial

O CPF tem 11 dígitos. Existe um problema real, conhecido e não opcional: **CPFs Sequenciais e Repetidos** — como `111.111.111-11`, `000.000.000-00` e `123.456.789-09` — passam no algoritmo matemático de dígito verificador, mas **não são CPFs válidos no mundo real** (a Receita Federal nunca emitiu esses). Um produto de validação que ignore isso mente para o usuário.

Portanto: **MUST** — a validação é em dois estágios: (A) Dígito verificador matemático; (B) Rejeição de sequenciais/repetidos. Ambos produzem carimbo **INVÁLIDO**, mas com **motivos distintos e legíveis** ("dígitos verificadores conferem, porém os dígitos são sequenciais — não é um CPF emitido").

### 1.2 Pitch de Elevator

> Você digita um CPF. A mesa de cartório acende. O papel respira. O carimbo desce com peso de ferro e tinta — e o veredito fica gravado no seu documento.

---

## 2. Visão do Produto

### 2.1 Declaração de Visão

> **Tornar a validação de CPF um momento de confiança.** Em vez de um `alert()` ou um texto verde/red, entregamos um ritual que transmite a gravidade e a natureza oficial do documento — e que as pessoas que usam CPF no dia a dia (contadores, clientes de banco, gateways de pagamento)associate a um registro civil.

### 2.2 Contexto de Uso

| Cenário | Dispositivo | Sessão | Emoção-alvo |
|---|---|---|---|
| Validação em formulário de cadastro | Desktop | 5–20s | Confiança, alívio |
| Conferência de nota fiscal / contracheque | Desktop | 3–10s | Precisão, seriedade |
| Teste rápido de um CPF | Mobile | 2–5s | Resposta clara, sem espera |
| Integração via API (futuro) | Server | — | Determinismo |

### 2.3. Superfície do Produto

- **App Web (este projeto)** — React + Three.js, deploy como SPA estática.
- **Widget embutível (roadmap)** — o mesmo carimbo em um `<iframe>` de 480×220 para integrar em formulários de terceiros.

### 2.4 Restrições Não-Negociáveis

| # | Restrição | Origem |
|---|---|---|
| R1 | Nenhum dado de CPF pode sair do navegador (sem rede, sem telemetria) | LGPD / privacidade |
| R2 | A UI **MUST** funcionar 100% sem WebGL (fallback CSS/SVG) | Acessibilidade + compatibilidade |
| R3 | Renderização **MUST** ocorrer ≤ 1 frame após a última tecla (sem "validar" button) | Performance percebida |
| R4 | O carimbo **MUST** ser a mensagem primária, não uma decoração | Clareza |
| R5 | Nada de dependências de UI kit genérico (nenhum Material/AntD/ shadcn-default) | Identidade |
| R6 | Todo texto de estado **MUST** ser acessível e falhar sem cor | WCAG 1.4.1 |

---

## 3. Metas e Não-Metas

### 3.1 Metas (v1.0)

| ID | Meta | Métrica de sucesso |
|---|---|---|
| M1 | Validar CPF em tempo real com feedback visual imediato | 0ms de atraso percebido após 11 dígitos |
| M2 | O estado do CPF é legível em ≤ 300ms | Teste de 5 usuários: 100% identificam o estado |
| M3 | O carimbo é memorável e distinto | "Diferente de tudo que eu já usei" em research |
| M4 | 60fps estáveis durante a coreografia do carimbo | p95 frame time ≤ 16.7ms |
| M5 | Zero requisições de rede após o carregamento | Network tab vazia em runtime |
| M6 | Acessibilidade WCAG 2.2 AA | Auditoria sem violações críticas |

### 3.2 Não-Metas (v1.0 — explícitos)

- ❌ **Não** é um validador de CNPJ, RG, CEP ou PIS (a arquitetura **MAY** permitir, mas fora do escopo).
- ❌ **Não** consulta a Receita Federal / Serpro / APIs de terceiros (verificação de existência real do CPF). *A validação é **estrutural**, não **registral**. Isso **MUST** ser comunicado na UI para não enganar o usuário.*
- ❌ **Não** é um app de cadastro/armazenamento de CPFs.
- ❌ **Não** tem backend, banco de dados, autenticação ou analytics.
- ❌ **Não** garante imutabilidade/carimbo "legal" (é um artefato visual, não um certificado).

### 3.3 O Que Este Produto Explicitamente NÃO Faz (e por quê importa)

A diferença entre "o CPF é matematicamente válido" e "o CPF existe" é a maior fonte de engano em validadores de CPF. O produto **MUST** exibir um micro-disclaimer persistente:

> Validação estrutural (dígitos verificadores). Não confirma existência na Receita Federal.

---
## 4. Personas e Histórias de Usuário

### 4.1 Persona Primária — "Aline, do financeiro"

- **Perfil:** 34 anos, analista de onboarding num banco digital. Valida 40–80 CPFs por dia.
- **Necessidade:** Rapidez e zero chance de erro. Confia no sistema, mas desconfia de UIs que "brincam" com documento oficial.
- **Frustração:** Validadores que dão "CPF válido" para números de teste e depois o cadastro é rejeitado downstream.
- **Expectativa de design:** Seriousidade, precisão, feedback instantâneo.

### 4.2 Persona Secundária — "Bruno, desenvolvedor"

- **Perfil:** 29 anos, front-end. Testa CPFs em formulários que constrói.
- **Necessidade:** Uma referência rápida e confiável de formato e regras.
- **Expectativa de design:** Clareza técnica, código limpo, sem fricção.

### 4.3 Persona Terciária — "Dona Clélia, 68 anos"

- **Perfil:** Usuária leiga, digita no celular, usa óculos de leitura.
- **Necessidade:** Entender o resultado sem esforço.
- **Expectativa de design:** Fonte grande, alto contraste, feedback não depende de cor, nenhuma animação que cause enjoo.

### 4.4 Histórias de Usuário

| ID | História | Critério de aceitação |
|---|---|---|
| US-01 | Como Aline, quero colar um CPF formatado e ter o resultado normalizado | `00000000000` → `000.000.000-00` |
| US-02 | Como Aline, quero ver o carimbo imediatamente ao completar 11 dígitos | Carimbo visível em ≤ 1 frame após o 11º dígito |
| US-09 | Como Bruno, quero saber *por que* um CPF foi rejeitado | Mensagem específica por motivo (dígito, sequencial, incompleto) |
| US-10 | Como Bruno, quero a regra explicada | Expansão com os 2 dígitos verificadores calculados |
| US-11 | Como Aline, quero copiar o CPF normalizado | Botão "copiar" com feedback de confirmação |
| US-12 | Como Bruno, quero limpar e começar de novo | Botão "Limpar" com transição de limpeza (papel desliza) |
| US-13 | Como Dona Clélia, quero ler o resultado sem depender de cor | `aria-live="polite"` anuncia o texto do carimbo |
| US-14 | Como Dona Clélia, quero evitar enjoo | `prefers-reduced-motion` desativa parallax e squash |
| US-15 | Como Bruno, quero testar rápido com CPFs de exemplo | Botões de amostra (válido / inválido / sequencial) |

### 4.5 Jobs-to-be-Done

| Persona | Job | Como o produto atende |
|---|---|---|
| Aline | "Quero ter certeza de que não cometi erro de digitação antes de fechar o cadastro" | Carimbo + motivo de falha detalhado |
| Bruno | "Quero validar a regra da minha própria biblioteca" | Fonte aberta, testes unitários, tokens documentados |
| Clélia | "Quero saber se está certo, sem medo" | Linguagem clara, zero ambiguidade, tipografia ampliada |

---

## 5. Princípios de Design

> Estes 10 princípios são o **filtro de taste** do projeto. Qualquer implementação que os contradiga **MUST** ser rejeitada em code review.

### P1 · O Carimbo É o Protagonista

O carimbo não é uma animação decorativa aplicada a um badge. É **a interface**. Se removêssemos todo o resto da tela, o carimbo sozinho ainda comunicaria o resultado. Isso **MUST** guide a hierarquia visual: o carimbo recebe ~55% da atenção, o input ~20%, o contexto ~15%, o resto ~10%.

### P2 · Peso e Inércia

Tudo que se move **MUST** ter massa. Nenhum elemento aparece, move ou para instantaneamente. A animação de carimbo usa um **spring** com damping alto (`stiffness: 420, damping: 26`) para simular ferro batendo em papel. A transição de estado da mesa acende como se uma lâmpada fosse ligada.

### P3 · Tinta, Não Cor

A cor nunca é o portador da informação. O resultado é comunicado por **forma, texto, textura e movimento**. Vermelho/verde são reforços, não o mecanismo. A informação **MUST** sobreviver em escala de cinza (teste de daltonismo).

### P4 · Documento, Não Formulário

A interface **MUST** lembrar papel, não dashboard. Superfícies retangulares com cantos levemente irregulares, sombras que sugam luz, textura de fibra. Nada de "cards" com `border-radius: 12px` e `box-shadow` genérico.

### P5 · O Movimento Explica, Não Decora

Cada animação **MUST** comunicar algo: a queda do carimbo diz "gravado"; o tremor diz "impacto"; a luz da mesa acendendo diz "processando"; a poeira parando diz "tempo congelado no instante do carimbo".

### P6 · Nada de Cor Como Única Via

Todo estado **MUST** ser identificável por texto + forma + ícone. Vermelho/verde são reforço, jamais o portador (WCAG 1.4.1).

### P7 · Silêncio e Densidade

O usuário **MUST** poder ficar em silêncio com a tela: sem sons, sem tooltips obrigatórios, sem modais. A tela precisa ser autossuficiente.

### P8 · Zero Requisição de Rede

Nenhuma requisição de rede **MAY** ocorrer após o carregamento inicial. Todo CPF digitado permanece no dispositivo (LGPD).

### P9 · Degradação Elegante

Sem WebGL → cena 2D com gradientes e textura CSS gerada proceduralmente. Sem `prefers-reduced-motion` → transições de opacidade de 150ms. Sem suporte a `backdrop-filter` → fallback de cor sólido.

### P10 · A Verdade Acima do Efeito

O carimbo **MUST** nunca mentir. A distinção entre "matematicamente válido" e "existe na Receita Federal" **MUST** estar visível. O impacto visual não pode mascarar a precisão da informação.

---
## 6. Linguagem Visual

### 6.1 Conceito: "Cartório às 7h da Manhã"

A cena não é um escritório de luxo nem um dashboard. É a **mesa de trabalho de um cartório**, logo cedo: luz rasante de janela lateral, poeira no ar, papel envelhecido, tinta de carimbo levemente oxidada. A referência emocional é a **analogia** (o carimbo) bem resolvida, não a paródia.

**Paleta completa:**

| Token | Hex | Uso |
|---|---|---|
| `--ink-900` | `#0E0B08` | Tinta mais profunda, texto principal |
| `--ink-800` | `#17120D` | Fundo do documento, carimbo |
| `--ink-700` | `#2A211A` | Tinta do carimbo (base) |
| `--ink-600` | `#4A3B2E` | Tinta secundária, hachuras |
| `--ink-400` | `#8A7660` | Texto terciário, bordas |
| `--paper-100` | `#F2EAD8` | Papel novo (superfície principal) |
| `--paper-200` | `#E7DBC4` | Papel em sombra |
| `--paper-300` | `#D8C8AC` | Fibra do papel, bordas |
| `--brass-500` | `#C8A24A` | Latão, detalhes do carimbo, metais |
| `--brass-600` | `#A8853A` | Latão em sombra |
| `--seal-green` | `#1F6B4A` | Tinta de "SELO DE CONFORMIDADE" |
| `--seal-red` | `#9E2B25` | Tinta de "NÃO CONFORME" |
| `--desk-900` | `#17120E` | Mesa de madeira escura |
| `--desk-700` | `#2E231A` | Grão da mesa |
| `--gold-leaf` | `#E7C56B` | Luz de borda, brilho de carimbo |
| `--void` | `#080605` | Fora do viewport, vinheta |

**Regras de cor:**

- **MUST** — a paleta de base é **monocromática quente** (tinta + papel + madeira). Cor saturada só aparece na tinta do carimbo. Isso faz o carimbo POP.
- **MUST** — verde e vermelho **MUST** ser usados nas versões degradadas (dessaturados e escurecidos) para parecerem tinta, não LED. Contraste ≥ 4.5:1 sobre `--paper-100`.
- **MUST** — o documento (papel) ter **gradiente radial** de iluminação vinda do topo-esquerdo, nunca cor plana.
- **SHOULD** — `--brass-500` aparecer no máximo em 3 pontos por viewport (reforço de foco).

**Gradientes canônicos:**

```css
--grad-paper: radial-gradient(ellipse 120% 90% at 32% 18%,
              #F7F0E0 0%, #F2EAD8 42%, #E4D6BA 78%, #D3C2A3 100%);
--grad-tinta:  linear-gradient(158deg, #2A211A 0%, #17120D 60%, #3A2C1F 100%);
--grad-latao:  linear-gradient(140deg, #E7C56B 0%, #C8A24A 38%, #8E6C2B 72%, #E7C56B 100%);
```

### 6.2 Tipografia

**Três famílias, três papéis:**

| Papel | Família | Fallback | Uso |
|---|---|---|---|
| Display / carimbo | **Special Elite** (Google Fonts) | `"Courier New", monospace` | Texto do carimbo, títulos |
| Texto / UI | **IBM Plex Sans** | `system-ui, sans-serif` | Labels, corpo, botões |
| Mono / dados | **IBM Plex Mono** | `ui-monospace, monospace` | O CPF em si, dígitos verificadores |

> **Racional:** *Special Elite* é uma typeface de máquina de escrever datilografada — carrega "documento oficial" sem ser caricata. Em par com Plex Sans (precisão suíça) e Plex Mono (dado), a hierarquia é clara.

**Escala tipográfica (com `clamp()` para responsividade fluida):**

| Token | Tamanho | Uso |
|---|---|---|
| `--fs-hero` | `clamp(2.75rem, 7vw, 5.5rem)` | CPF renderizado no documento |
| `--fs-stamp` | `clamp(1.05rem, 2.6vw, 1.75rem)` | Texto do carimbo |
| `--fs-title` | `clamp(1.5rem, 3.2vw, 2.25rem)` | Título da página |
| `--fs-body` | `clamp(0.95rem, 1.4vw, 1.05rem)` | Corpo |
| `--fs-label` | `0.75rem` | Labels (uppercase, tracking largo) |
| `--fs-mono` | `clamp(1rem, 2vw, 1.25rem)` | CPF no input |

**Regras:**

- **MUST** — labels em `--ink-600`, `text-transform: uppercase`, `letter-spacing: 0.18em`, `font-size: 0.75rem`, `font-weight: 600`.
- **MUST** — o texto do carimbo em *Special Elite* com `letter-spacing: 0.12em`.
- **MUST** — números **MUST** usar `font-variant-numeric: tabular-nums` (evita jitter durante a digitação).
- **SHOULD** — o CPF no hero ter leve `text-shadow: 0 1px 0 rgba(255,255,255,.6), 0 -1px 0 rgba(0,0,0,.25)` para parecer pressionado no papel.

---
### 6.3 Textura: O Segredo do Realismo

Sem textura, um carimbo é um "badge". Com textura, é um objeto. **MUST** usar 4 camadas de textura simultâneas:

1. **Grão de fibra do papel** — SVG `feTurbulence` (`baseFrequency: 0.8`, `numOctaves: 4`) → `feColorMatrix` para desaturar. Aplicado via `background-blend-mode: multiply` a 8% de opacidade.
2. **Granulação de tinta** — mesmo `feTurbulence` com `baseFrequency: 0.9 0.35` (anisotrópico) → `feComposite` com `operator="in"` sobre a forma do carimbo. Opacidade 22%.
3. **Desgaste das bordas** — `feTurbulence` + `feDisplacementMap` (`scale: 4`) para irregularizar o contorno do carimbo.
4. **Fibras de papel** — linhas finas aleatórias em `background-image` com `repeating-linear-gradient` a 3% de opacidade.

> **Implementação:** todas as texturas são **SVG filters inline** (data-URI) definidas uma única vez em `<defs>` do documento — zero requisições de rede, zero assets binários.

### 6.4 Forma do Carimbo

O carimbo **MUST** ser construído como SVG, não como `div` com borda:

- **Contorno externo** — retângulo com cantos levemente arredondados (r=6) e **bordas deliberadamente irregulares** (path gerado com ruído, não retângulo perfeito).
- **Anel duplo** — dois anéis concêntricos: externo (2.5px) e interno (1.2px), separados por 8px, criando a aparência de carimbo oficial.
- **Barra de texto superior** — "REGISTRO GERAL DE DOCUMENTOS" em arco superior (texto em path).
- **Barra de texto inferior** — o veredito, em arco inferior ou reta.
- **Marca central** — um símbolo geométrico (estrela de 5 pontas dentro de um escudo simplificado) ou o próprio CPF.
- **Elemento de data** — "NA DATA DE HOJE" ou o valor formatado, como um carimbo de data.
- **Assinatura manuscrita** — um traço SVG curvo (Bézier) simulando assinatura, único por sessão.

**Variações por estado:**

| Estado | Texto principal | Cor | Forma |
|---|---|---|---|
| `VALID` | "SELO DE CONFORMIDADE" | `--seal-green` | Anel duplo completo, marca de check |
| `INVALID` | "NÃO CONFORME" | `--seal-red` | Anel **cortado** (gap de 40° no topo), diagonais |
| `SEQUENTIAL` | "CPF SEM EMISSÃO" | `--seal-red` | Anel cortado + linha tracejada |
| `INCOMPLETE` | `—` | `--ink-400` | Carimbo fantasma, 20% opacidade, sem impacto |
| `EMPTY` | `—` | `--ink-400` | Nada é renderizado |

### 6.5 Iluminação e Sombras

O documento de papel **MUST** ter iluminação simulada com **duas** sombras combinadas:

```css
/* Sombra de contato: o papel está sobre a mesa */
box-shadow:
  0 1px 2px rgba(8,6,5,.55),
  0 8px 22px rgba(8,6,5,.38),
  0 28px 60px rgba(8,6,5,.45),
  inset 0 1px 0 rgba(255,255,255,.55),
  inset 0 -30px 60px rgba(120,96,60,.14);

/* Vinheta: a luz vem do topo-esquerdo */
background-image:
  radial-gradient(ellipse 100% 80% at 30% 12%, rgba(255,252,242,.85), transparent 60%),
  radial-gradient(ellipse 120% 100% at 70% 110%, rgba(90,70,44,.20), transparent 55%);
```

**MUST** — a sombra do carimbo ser **dupla**: sombra de contato dura e curta (o carimbo toca o papel) + sombra difusa e deslocada (a altura do carimbo). Ao "cair", a sombra **MUST** se separar da forma (sensação de altura) e depois **colapsar** no impacto.

### 6.6 Ruído e Vinheta Globais

- **MUST** existir uma camada de vinheta global (`pointer-events: none`) que escurece as bordas em ~25%, criando foco no centro.
- **SHOULD** — a vinheta ser `position: fixed` e ter `mix-blend-mode: multiply`.
- **MUST** — o `::selection` ser customizado com a cor do latão.

### 6.7 Espaçamento e Ritmo

Escala base de 4px (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).

| Contexto | Espaçamento |
|---|---|
| Gap interno do carimbo | 8px |
| Padding do documento | `clamp(24px, 4vw, 56px)` |
| Padding do input | 18px 20px |
| Gap entre input e resultado | 32px |
| Gap entre seções | 96px |
| Padding mobile | 20px |

**MUST** — o documento de papel ser `max-width: 720px` e centralizado, com altura crescendo com o conteúdo.

---
## 7. Sistema de Motion

> Motion não é enfeite aqui. É o **vocabulário físico** do produto. Esta seção define as primitivas de movimento, os tokens de easing, e as regras que garantem que tudo pareça pertencer ao mesmo mundo físico.

### 7.1 Filas

| ID | Curva | CSS `cubic-bezier` | Uso |
|---|---|---|---|
| `--ease-ink` | "Impacto" | `cubic-bezier(0.22, 1, 0.36, 1)` | Entradas de carimbo, o "queda" |
| `--ease-paper` | "Papel" | `cubic-bezier(0.4, 0, 0.2, 1)` | Movimentos de superfície, slides |
| `--ease-metal` | "Latão" | `cubic-bezier(0.16, 1, 0.3, 1)` | Micro-interações, hover, focus |
| `--ease-settle` | "Assentamento" | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot suave, elásticos |
| `--ease-tilt` | "Inclinação" | `cubic-bezier(0.65, 0, 0.35, 1)` | Rotação, 3D transforms |

### 7.2 Durações

| Token | Valor | Uso |
|---|---|---|
| `--dur-instant` | 80ms | Feedback de digitação |
| `--dur-fast` | 160ms | Hover, focus ring |
| `--dur-base` | 260ms | Micro-transições |
| `--dur-slow` | 450ms | Painéis, expansão |
| `--dur-stamp` | 900ms | Coreografia completa do carimbo |
| `--dur-ambient` | 6s | Loops de ambiente (poeira, luz) |

### 7.3 Primitivas de Movimento

Todo movimento **MUST** ser composto por uma ou mais destas primitivas:

#### P-SPRING · Mola

Movimento com inércia e overshoot. Usado em tudo que tem "peso" (carimbo, botão, papel).

```ts
// Configuração canônica
{ type: 'spring', stiffness: 420, damping: 26, mass: 1.1 }
// Props: stiffness 180-500 | damping 14-40 | mass 0.6-1.8
```

**Regras:** `damping` **MUST** ser ≤ `stiffness/12` para haver overshoot visível; e ≥ `stiffness/20` para evitar oscilação longa.

#### P-SQUASH · Compressão e Alongamento

Deformação volumétrica (não é scale uniforme). Usada **exclusivamente** no impacto do carimbo.

```ts
// Sequência no impacto
{ scaleX: 1.22, scaleY: 0.72 }  // squash (frame do impacto)
{ scaleX: 0.94, scaleY: 1.10 }  // stretch (rebote)
{ scaleX: 1.02, scaleY: 0.98 }  // micro-settle
{ scaleX: 1,    scaleY: 1    }  // repouso
```

**MUST** — a deformação **MUST** incluir `scaleZ` quando o elemento tem `perspective` no ancestral, para simular achatamento volumétrico (não apenas achatamento 2D).

#### P-TILT · Inclinação

Rotação em Z (e Y para 3D) com origem controlada.

```ts
{ rotate: -8, transformOrigin: '30% 20%' }  // carimbo levemente torto
```

**MUST** — o carimbo **MUST** ter rotação base entre **-9° e -4°** (nunca perfeitamente reto — carimbo real nunca é). A rotação **MUST** variar por sessão (seed) para evitar que pareça template.

#### P-SHAKE · Tremor de Impacto

Deslocamento de alta frequência, decaindo exponencialmente.

```ts
// offsets em px: [0, -7, 6, -4, 2, -1]
const SHAKE = [0, -7, 6, -4, 2.5, -1, 0.5, 0]
// duration: 420ms | ease: linear
```

**MUST** — o tremor **MUST** ser aplicado ao **documento inteiro** (não só ao carimbo), com amplitude ≤ 8px.

#### P-DRAW · Traçado

Desenho de paths SVG via `pathLength` (0→1).

```ts
{ pathLength: [0, 1], transition: { duration: 0.55, ease: [0.65, 0, 0.35, 1] } }
```

**Usos:** contorno do carimbo sendo desenhado, check sendo traçado, linha de risco sendo riscada.

#### P-INK-BLEED · Difusão de Tinta

Simulação de tinta se espalhando no papel: escala de opacidade + blur crescendo, com máscara de ruído.

```ts
{ scale: [0.7, 1.06, 1], opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] }
```

#### P-TYPE · Digitação Mecânica

Para a revelação do CPF no documento: caracteres aparecem com jitter vertical de ±1px, como impacto de tecla.

```ts
// stagger de 28ms por caractere, com offset y alternado [-1, 0, 1]
```

### 7.4 Regras Globais de Motion

| # | Regra |
|---|---|
| MR1 | Nada **MUST** entrar em menos de 150ms (senão parece flash) |
| MR2 | Nada **MUST** sair em mais de 400ms (senão trava a atenção) |
| MR3 | Todo movimento **MUST** respeitar `prefers-reduced-motion` |
| MR4 | Elementos que entram **MUST** entrar por opacidade + transform (nunca por `display`/`height`) |
| MR5 | A cena 3D **MUST** pausar quando a aba está oculta |
| MR6 | O carimbo **MUST** ser a única coisa que usa squash (exclusividade → o squash tem significado) |
| MR7 | Transformações 3D **MUST** declarar `will-change: transform` apenas durante a animação |
| MR8 | Easing **MUST** ser monótono em entradas, simétrico em saídas, e **NUNCA** `linear` exceto em tremor e loops de ambiente |

### 7.5 `prefers-reduced-motion`

Quando `prefers-reduced-motion: reduce` estiver ativo:

- **MUST** — squash, shake, bleed e tilt de impacto serem **removidos** (não apenas encurtados).
- **MUST** — o carimbo ainda **aparecer** e ainda ser claramente legível, com `opacity: 0 → 1` em 150ms.
- **MUST** — a paralaxe do cursor ser **desativada** (posição fixa, sem interpolação).
- **MUST** — loops de ambiente (poeira, oscilação de luz) serem **parados**.
- **SHOULD** — transições de estado (hover, focus) serem mantidas em 100ms.

### 7.6 Tabela de Mapping: Estado → Animação

| Transição | Animação |
|---|---|
| `EMPTY` → `INCOMPLETE` | Opacidade 0→0.2, sem impacto, sem som |
| `INCOMPLETE` → `VALID` | Carimbo completo: impacto + squash + tremor + bleed |
| `INCOMPLETE` → `INVALID` | Carimbo completo: impacto mais pesado (amplitude +30%) |
| `INCOMPLETE` → `SEQUENTIAL` | Impacto + carimbo cortado + "rasura" animada |
| `VALID` → `VALID` (novo CPF) | Carimbo antigo sai (fade + scale down), novo entra com impacto |
| `VALID` → `INCOMPLETE` (apagou) | Carimbo sai com fade 200ms, papel "limpo" |
| `ANY` → `EMPTY` | Papel desliza para fora (slide down), cena volta ao repouso |

---
## 8. Coreografia do Carimbo (o Heartbeat do Produto)

Esta é a cena mais importante do produto. É a coreografia que transforma um `true`/`false` em um **evento**. Ela **MUST** ser executada em ~900ms e **MUST** ser sentida como um único movimento coerente, não como uma sequência de efeitos.

### 8.1 Timeline

| t (ms) | Camada | Evento | Detalhe |
|---|---|---|---|
| 0 | Ambiente | **Luz acende** | A luminária da mesa acende (fade 180ms, easing metal). O papel sai da penumbra. |
| 0 | Som | — | (Sem som — ver §7.4/P7. Silêncio absoluto.) |
| 40 | Documento | **CPF surge** | Cada caractere do CPF aparece com stagger de 28ms e jitter vertical (P-TYPE). Total ~340ms. |
| 120 | 3D | **Cena reage** | A mesa inclina 0.6° na direção do cursor (parallax). Poeira se move. |
| 300 | Carimbo | **Sombra aparece** | A sombra do carimbo nasce separada da forma (offset Y = -28px, blur 18px, opacidade 0.45) — o carimbo está no alto. |
| 300 | Carimbo | **Carimbo desce** | Translate Y de -120px → 0 com `--ease-ink` (550ms). Simultaneamente: opacity 0→1, scale 1.35→1. |
| 420 | Carimbo | **Tilt se acomoda** | Rotate de -14° → -7° (rotação base da sessão), spring suave. |
| 560 | 3D | **Poeira congela** | As partículas de poeira **param** (timeScale 1 → 0.05). O instante do carimbo congela o tempo. |
| 850 | Carimbo | **IMPACTO** | Quadro de squash: `scaleX 1.24 / scaleY 0.74` (duração 90ms) + tremor do documento + flash de tinta. |
| 850 | 3D | **Onda de choque** | Um anel de luz se expande no chão da mesa (0.6s, fading). |
| 940 | Carimbo | **Rebote** | `scaleX 0.93 / scaleY 1.10` → micro-settle → repouso. Total 260ms. |
| 940 | Carimbo | **Bleed de tinta** | Halo de tinta se espalha (P-INK-BLEED, 420ms) revelando a granulação. |
| 1020 | Carimbo | **Traçado do anel** | O contorno do carimbo é desenhado (P-DRAW, 550ms, delay 120ms). |
| 1180 | Carimbo | **Check / Cruz** | Símbolo central é desenhado (P-DRAW, 400ms). |
| 1250 | Texto | **Veredito** | O texto do carimbo surge com blur→sharp (320ms) + leve tracking animation. |
| 1350 | 3D | **Poeira retoma** | TimeScale volta a 1. O mundo respira de novo. |
| 1500 | — | **Repouso** | Tudo em repouso. Estado estável. |

> **Nota de design:** o "impacto" auditivo foi deliberadamente removido. Um carimbo real é silencioso, e o silêncio **amplifica** a sensação de peso. (Se o usuário habilitar som no futuro, será o *thud* gravado de um carimbo de metal sobre papel.)

### 8.2 Diagrama de Sincronia

```
t=0      ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
Luz:     ████▌                                                          ░░░░░░░
CPF:         ████████████▌
Carimbo:                 ░░░░░░░░░▌
                             ██████████████████░░░░░░░░░░░░░░░░░░░░░░
Impacto:                                             ██▌░░░░
Sombra:              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▌░░░░░░░░░░░░░
Bleed:                                                ░░░░░░░░░░░░░░░░░
Anel:                                                  ░░░░░░░░░░░░░░░░
Veredito:                                                        ████████▌
Poeira: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▌░░░░░░░░░░
         0    100   200   300   400   500   600   700   800   900  1000 1100 1200 1300 1400 1500
```

### 8.3 Variações por Estado

| Estado | Diferença na coreografia |
|---|---|
| `VALID` | Impacto limpo. Um brilho dourado (gold-leaf) percorre o anel **uma** vez, da esquerda para a direita, em 700ms. |
| `INVALID` | Impacto **mais pesado**: squash maior (1.30 / 0.68), tremor amplitude +30%, e a cena treme mais. O anel tem um **gap** de 40° no topo (nunca fechado). |
| `SEQUENTIAL` | Impacto normal, mas uma **riscada** (path tracejado) é desenhada diagonalmente sobre o anel, e o texto inferior pisca 2x (indicando "cancelado"). |
| `INCOMPLETE` | Sem impacto, sem tremor. Apenas opacidade 0.18 e um "respiro" (scale 1 → 1.005 → 1 em 2s, loop) para indicar que está **aguardando**. |
| Re-validação (novo CPF) | O carimbo anterior **não** é removido instantaneamente: ele recebe um "fade de tinta" (blur + opacity 220ms) e o novo toma o lugar. Isso evita flicker em validações rápidas. |

### 8.4 Anti-Flicker (Regras de Rapididade)

Como a validação é em tempo real, é fácil disparar 10 carimbos em 2 segundos. Regras **MUST**:

1. **Debounce de 120ms** — a coreografia só inicia se o CPF ficar completo e estável por 120ms. (Evita carimbar a cada tecla no 11º dígito se o usuário colar.)
2. **Cancelamento** — se um novo estado chegar durante a coreografia, a animação atual é **interrompida** e uma nova começa (usando `AnimatePresence` com `mode="popLayout"`).
3. **Coalescência** — se o estado final for o mesmo do atual, **nenhum** carimbo novo é criado (apenas um micro "recarimbo" — o anel pulsa 1 vez).

### 8.5 A "Vinheta de Impacto"

No quadro do impacto, um **flash radial** (elemento branco/quente, `mix-blend-mode: overlay`, opacidade 0.0 → 0.14 → 0) sai do ponto de contato do carimbo por 200ms. Isso é o que faz o impacto ser **percebido** mesmo em telas de baixa taxa de atualização.

---
## 9. Layout, Grade e Responsividade

### 9.1 Estrutura da Página

```
<body>
 ├─ <canvas id="scene">          ← Three.js (fixo, z-index 0)
 ├─ <div class="vignette">        ← vinheta global (fixo, z-index 1)
 ├─ <main class="desk">           ← conteúdo (z-index 2)
 │   ├─ <header class="masthead">
 │   │   ├─ .seal-emblem (SVG, latão, uma vez por sessão)
 │   │   └─ h1 "Cartório Digital de CPF"
 │   ├─ <section class="station">        ← o "balcão" de digitação
 │   │   ├─ .label "Cadastro Fiscal"
 │   │   ├─ .cpf-field (input + cursor carimbado)
 │   │   └─ .actions (copiar / limpar / amostras)
 │   ├─ <article class="document">        ← o PAPEL
 │   │   ├─ .doc-header (nome do órgão, nº de registro)
 │   │   ├─ .doc-body (CPF em hero + detalhes)
 │   │   └─ <Stamp />                    ← O CARIMBO (absolutely positioned)
 │   ├─ <section class="verdict">        ← explicação textual
 │   │   ├─ .verdict-title
 │   │   ├─ .verdict-reason
 │   │   └─ <details class="rule">       ← quebra técnica do DV
 │   └─ <footer class="colophon">
 │        └─ disclaimer "validação estrutural..."
 └─ <div class="a11y-live" aria-live="polite">  ← região de anúncio
```

### 9.2 Grade

- **MUST** usar uma grade de **12 colunas** com gutter de 24px, max-width 1200px.
- **MUST** — a coluna do conteúdo (`.station` + `.document`) ocupar **8 colunas** centralizadas (span 8, offset 2) em desktop.
- **MUST** — em ≤ 900px, tudo colapsa para **1 coluna** com padding lateral de 20px.
- **SHOULD** — o `.document` ser ligeiramente **assimetrico** (rotate -0.4°) para não parecer um card centralizado perfeito.

### 9.3 Breakpoints

| Nome | Largura | Layout |
|---|---|---|
| `xs` | < 480px | 1 coluna, carimbo em 92% do papel, tipografia mínima |
| `sm` | 480–767px | 1 coluna, padding 24px |
| `md` | 768–1023px | 1 coluna centralizada, papel 560px |
| `lg` | 1024–1439px | 8/12 colunas, 3D cena completa |
| `xl` | ≥ 1440px | 8/12 colunas, vinheta mais forte, partículas extras |

### 9.4 Regras de Camadas (z-index)

| z-index | Camada | Motivo |
|---|---|---|
| 0 | Canvas 3D | Fundo absoluto |
| 1 | Vinheta + grão | Atmosfera |
| 2 | Conteúdo (`main`) | Interativo |
| 3 | `.document` | Papel acima da mesa |
| 10 | `.stamp` | Carimbo acima do papel |
| 20 | `.impact-flash` | Flash do impacto (acima de tudo) |
| 100 | Tooltip / popover | — |

**MUST** — o carimbo **MUST** estar em `z-index: 10` **dentro** do `.document` (que cria um novo stacking context via `transform`/`filter`), de modo que ele pareça **sobre o papel** e não flutue sobre a página inteira.

### 9.5 Diagrama Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░  vinheta + cena 3D ao fundo ░░░░░░░░░░░  │
│                                                                │
│                    ⚜  CAR T Ó R I O   D I G I T A L             │
│                        de CPF · validador                     │
│                                                                │
│         ┌────────────────────────────────────┐                 │
│         │  CADASTRO FISCAL                   │                 │
│         │  ┌──────────────────────────────┐  │                 │
│         │  │  000.000.000-00            📋 │  │                 │
│         │  └──────────────────────────────┘  │                 │
│         │  [copiar] [limpar]  amostras: ● ● ●  │                 │
│         └────────────────────────────────────┘                 │
│                                                                │
│         ┌────────────────────────────────────────┐             │
│         │  REGISTRO GERAL DE DOCUMENTOS   Nº 0042│             │
│         │  ───────────────────────────────────── │             │
│         │         123.456.789-09                │             │
│         │      ┌────────────────────┐           │             │
│         │      │  ╭──────────────╮  │           │             │
│         │      │  │  CARIMBO 3D  │  │           │             │
│         │      │  ╰──────────────╯  │           │             │
│         │      └────────────────────┘           │             │
│         │  ───────────────────────────────────── │             │
│         │  Nome:  Maria de Lourdes              │             │
│         └────────────────────────────────────────┘             │
│                                                                │
│         ▸ Por que este CPF foi aceito / recusado                │
│                                                                │
│         Validação estrutural. Não confirma existência na RFB.    │
└────────────────────────────────────────────────────────────────┘
```

---
## 10. Especificação de Telas

O produto tem **uma única tela** (SPA), mas ela tem **cinco estados visuais** distintos. A "tela" é uma composição; o estado é determinado pelo CPF digitado.

### 10.1 Estado `EMPTY` — A Mesa em Repouso

- Nenhum papel visível (o `.document` tem `opacity: 0`, `translateY(40px)`).
- O campo de input **flutua** sobre a mesa, com sombra e um leve reflexo.
- A cena 3D está em repouso: luz acesa em 35% de intensidade, poeira derivando devagar.
- Título e subtítulo presentes.
- **MUST** — o campo de input **MUST** estar sempre visível e focável.

### 10.2 Estado `INCOMPLETE` — O Rascunho

- O papel **aparece** (fade 260ms + slide up 24px) assim que há ≥ 1 dígito.
- O CPF é exibido no hero, com os dígitos digitados em `--ink-900` e os por vir em `--ink-400` (placeholders `•`).
- O carimbo fantasma (20% opacidade) aparece centralizado, respirando.
- **MUST** — o papel **MUST** mostrar o progresso: `7 de 11 dígitos` em label pequeno.

### 10.3 Estado `VALID` — O Selo

- Carimbo **verde-escuro** com anel duplo completo, estrela e "SELO DE CONFORMIDADE".
- Um **brilho dourado** percorre o anel uma vez.
- A linha do veredito: *"CPF estruturalmente válido. Dígitos verificadores conferem."*
- A quebra técnica (`<details>`) mostra os 2 DVs calculados.

### 10.4 Estado `INVALID` — A Reprovação

- Carimbo **vermelho-escuro** com anel **cortado** (gap no topo), diagonais cruzando o centro.
- O texto: *"Dígito verificador inválido. Este CPF não foi emitido."* — o texto exato varia (ver §13.4).
- A cena treme mais forte; a luz pisca levemente (uma vez).

### 10.5 Estado `SEQUENTIAL` — A Cancelagem

- Carimbo **vermelho-escuro** com anel cortado + **riscada diagonal tracejada** desenhada.
- Texto: *"Dígitos verificadores conferem, mas o número é sequencial — a Receita Federal não emite este CPF."*
- **MUST** — este estado **MUST** ser visualmente distinto do `INVALID` (riscada vs. diagonais), para que o usuário diferencie "cálculo errado" de "CPF de mentira".

### 10.6 Micro-copy (textos exatos)

**Título:** `Cartório Digital de CPF`
**Subtítulo:** `Validação de registro fiscal — verificação estrutural de dígitos verificadores.`

**Estado vazio (hint do campo):** `Digite ou cole os 11 dígitos do CPF`
**Label do campo:** `Cadastro Fiscal · CPF`

**Veredito válido:**
- Título: `SELO DE CONFORMIDADE`
- Linha: `Os dígitos verificadores conferem. Este CPF é matematicamente válido.`
- Nota: `Não confirma a existência do titular na Receita Federal.`

**Veredito inválido (DV):**
- Título: `NÃO CONFORME`
- Linha: `O {n}º dígito verificador esperado é {dv}, mas foi encontrado {informado}.`
- Nota: `Revise os números antes de continuar.`

**Veredito sequencial:**
- Título: `CPF SEM EMISSÃO`
- Linha: `Os dígitos verificadores conferem, porém todos os dígitos são iguais ou seguem uma sequência. A Receita Federal nunca emitiu este número.`

**Botões:**
- `Copiar` · `Limpar` · `Validar de novo`
- Amostras: `válido` · `dígito errado` · `sequencial`

**Disclaimer (footer, sempre visível):**
> Validação **estrutural** (dígitos verificadores). Não confirma existência na Receita Federal nem substitui consulta oficial.

**Regra em `aria-live`:** o texto anunciado **MUST** ser o título + a linha de veredito, em uma única frase. Ex.: `"CPF não conforme. O décimo dígito verificador esperado é 6, mas foi encontrado 9."`

---
## 11. Especificação da Cena 3D (Three.js)

### 11.1 Papel da Cena 3D

A cena 3D **MUST** ser um **cenario**, não o conteúdo. Ela estabelece o mundo (mesa, luz, poeira) e reage aos eventos, mas **nunca** deve competir com o carimbo em atenção. Regras:

- **MUST** — a cena **MUST** ser visivelmente **fora de foco** (desaturation parcial + contraste baixo). OPapel e o carimbo estão em foco; o fundo não.
- **MUST** — a cena **MUST** reagir a `pointermove`, `pointerdown` (impacto) e ao estado da validação.
- **MUST** — a cena **MUST** ter fallback funcional (seção 11.8).
- **SHOULD** — a cena **MUST** ser desabilitada automaticamente se o dispositivo reportar bateria baixa ou `deviceMemory < 4` (heurística, não padrão).

### 11.2 Composição da Cena

```
                    ┌──────────────────────┐
   Luz principal    │   SpotLight (janela) │   ← topo-esquerdo, rasante
   (brasa, 3200K)   └──────────┬───────────┘
                               ╲
     ╔══════════════════════════════════════════╗   ← Parede ao fundo (dark)
     ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
     ║  ░░░░░░  Mesa (wood shader) ░░░░░░░░░░  ║
     ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
     ╚══════════════════════════════════════════╝
              ✦ ✦  partículas de poeira (600)  ✦ ✦
                        ▲
                   Camera (fov 38, y=2.2, z=5.4)
```

### 11.3 Objetos

| Objeto | Tipo | Materiais | Notas |
|---|---|---|---|
| **Mesa** | `PlaneGeometry` 40×40, rotacionada -90° X | `MeshStandardMaterial` com `map` procedural (canvas 2D: grão de madeira), `roughness: 0.78`, `metalness: 0.0` | Textura gerada em `<canvas>` no cliente — **zero assets** |
| **Papel (3D) | `PlaneGeometry` 2.4×1.6 | `MeshStandardMaterial` branco (`#F2EAD8`), `roughness: 0.92` | **SHOULD** — existe para dar a sombra projetada e o "peso" do papel. É **opcional** (feature flag) |
| **Poeira** | `Points` × 600 | `PointsMaterial` `size: 0.012`, `color: #E7C56B`, `opacity: 0.35`, `blending: Additive` | Distribuídos num volume `x[-6,6] y[0,5] z[-4,2]` |
| **Luz principal** | `SpotLight` `#FFD9A0`, intensity 2.4, angle 0.55, penumbra 0.8 | — | Posição `(-4, 6, 3)`, alvo no centro |
| **Luz ambiente** | `AmbientLight` `#2A211A`, intensity 0.55 | — | Só pra evitar preto puro |
| **Preenchimento** | `DirectionalLight` `#4A5A7A` (frio), intensity 0.25 | — | Contraste frio/quente |
| **Onda de choque** | `RingGeometry` no chão | `MeshBasicMaterial` additive | Criado no impacto, expande e some (600ms) |
| **Câmera** | `PerspectiveCamera` fov 38 | — | `position (0, 2.2, 5.4)`, `lookAt (0, 0.3, 0)` |

### 11.4 Ambiente Procedural (sem assets)

**Textura da mesa** — gerada em `OffscreenCanvas`/`<canvas>` 1024×1024:

1. Base em `#2E231A`.
2. **Veios de madeira**: 220 linhas curvas (`bezierCurveTo`) com alpha 0.05–0.12, cor variando entre `#17120E` e `#4A3A28`.
3. **Ruído fino**: 40.000 pontos de 1px com alpha 0.02.
4. **Desgaste**: gradiente radial escurecendo as bordas.

**MUST** — a textura **MUST** ser gerada proceduralmente. **MUST NOT** usar imagens externas.

### 11.5 Parallax 3D (câmera)

A câmera segue o cursor com **atenuação elástica**:

```ts
// targetNormalized ∈ [-1, 1]
const MAX_OFF = { x: 0.55, y: 0.32 }

target.x = nx * MAX_OFF.x
target.y = BASE_Y + ny * MAX_OFF.y
target.z = BASE_Z + Math.abs(nx) * 0.18   // aproxima no eixo do cursor

// no loop: lerp com fator dependente de dt
camera.position.lerp(target, 1 - Math.pow(0.001, dt))
camera.lookAt(0, 0.3 + ny * 0.06, 0)
```

**Constantes:** lerp `1 - 0.001^dt` (independente de framerate), `MAX_OFF.x = 0.55`, `MAX_OFF.y = 0.32`.

**MUST** — o damping **MUST** ser baseado em `dt` (não em frame count), para que a paralaxe seja idêntica a 30fps e 120fps.

### 11.6 Reação ao Estado

| Evento | Reação da cena 3D |
|---|---|
| `EMPTY` | Luz em 35%, mesa em repouso, poeira deriva lentamente |
| `INCOMPLETE` | Luz sobe para 60%, pulsação suave (±3%) a cada 2s |
| `VALID` | Luz sobe para 100%, brilho dourado, poeira **congela** no impacto e retoma |
| `INVALID` | Luz **pisca** (1 frame a 140%, volta), tremor de câmera 0.4°, poeira se dispersa |
| `SEQUENTIAL` | Luz fica em 55% (sem狂欢), tom esverdeado/cinza por 300ms |
| Impacto | Onda de choque no chão + `camera.shake` (amplitude 0.06, 400ms) |

### 11.7 Loop de Renderização

**MUST** — usar `requestAnimationFrame` com **clamp de delta** (`Math.min(dt, 1/20)`) para evitar saltos após aba em background.

**MUST** — pausar o loop quando `document.hidden` (via `visibilitychange`) e retomar.

**MUST** — `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` (cap de 2 para performance).

**MUST** — `renderer.outputColorSpace = THREE.SRGBColorSpace` e `toneMapping = THREE.ACESFilmicToneMapping` com `toneMappingExposure = 1.05` (para o highlight da luz não estourar).

**SHOULD** — `antialias: true` apenas se `devicePixelRatio <= 2`; em telas 3x, desativar (o grão já mascara aliasing).

### 11.8 Fallback sem WebGL

Se `WebGLRenderingContext` não existir ou `canvas.getContext('webgl2'/'webgl')` falhar:

- **MUST** — renderizar um **gradiente CSS puro** equivalente: `radial-gradient` quente no topo-esquerdo + `linear-gradient` escuro nas bordas + um grão SVG estático.
- **MUST** — o restante da UI **MUST** funcionar 100% igual (a cena 3D nunca é requisito para o carimbo).
- **SHOULD** — exibir um aviso minúsculo no console (não na UI) — o usuário não deve se importar.

### 11.9 Dependências

| Lib | Versão | Uso |
|---|---|---|
| `three` | ^0.169 | Core 3D |
| `motion` (framer-motion) | ^11 | Camada 2D / React |
| `react` / `react-dom` | ^18.3 | UI |

**MUST NOT** — usar `@react-three/fiber` (R3F) no v1.0. Motivo: o controle imperativo fino (lerp dependente de dt, pause, shake, tone mapping) é mais direto e leve em Three.js imperativo, e evita um bundle maior. **MAY** ser reavaliado no v2.

---
## 12. Sistema de Parallax

O parallax existe em **quatro camadas concêntricas**, cada uma com profundidade e velocidade diferentes. Isso cria o efeito de volume sem exigir que a cena 3D carregue todo o peso.

### 12.1 As Três Camadas

| Camada | Elemento | Profundidade | Deslocamento máx. | Easing |
|---|---|---|---|---|
| **L0 · Fundo** | Cena 3D (mesa, luz, poeira) | `z = 0` | Câmera: 0.55 unid. | lerp `1-0.001^dt` |
| **L1 · Fundo 2D** | Vinheta, grão global, brasão decorativo | `z = 1` | 8px | lerp 0.08 |
| **L2 · Conteúdo** | Input, papel, rodapé | `z = 2` | 16px | lerp 0.12 |
| **L3 · Frontal** | Carimbo, flash de impacto | `z = 10+` | 26px | lerp 0.18 |

> **Regra de paralaxe (MUST):** camadas mais à frente **MUST** se mover **mais** que as de trás (parallax reversal gera desconforto e quebra a ilusão de profundidade).

### 12.2 Normalização do Ponteiro

```ts
// nx, ny ∈ [-1, 1]
const nx = (e.clientX / window.innerWidth)  * 2 - 1
const ny = (e.clientY / window.innerHeight) * 2 - 1
```

**MUST** — usar `requestAnimationFrame` para aplicar as transformações (nunca no handler do `pointermove` direto), para evitar layout thrashing.

**MUST** — o valor ser **suavizado** por lerp exponencial, nunca aplicado de forma instantânea.

### 12.3 Parallax do Documento (2D)

O papel (`.document`) tem uma inclinação 3D sutil reagindo ao cursor:

```ts
rotateY: nx * 2.2,   // graus
rotateX: -ny * 1.6,  // graus
```

com `transform-style: preserve-3d` e `perspective: 1200px` no pai.

**Constantes:** `rotateY max 2.2°`, `rotateX max 1.6°`. Valores pequenos de propósito: o papel deve parecer **parado sobre a mesa**, com apenas um leve deslocamento de perspectiva.

**MUST** — o papel **MUST** manter `translateZ(0)` para forçar rasterização em uma camada e evitar blur de subpixel.

### 12.4 Parallax do Carimbo

O carimbo, por estar "acima" do papel, tem o **maior** deslocamento:

```ts
x: nx * 10,
y: ny * 7,
```

**Racional:** o carimbo é o objeto com mais "vida" na cena; ampliá-lo cria a sensação de que ele está levemente solto do papel — o que é *quase* verdade (a tinta tem relevo).

### 12.5 Parallax de Scroll (Opcional)

**MAY** — um leve parallax vertical no scroll (o papel sobe a 0.85× a velocidade do scroll), criando o efeito de que o documento está em uma camada abaixo do cabeçalho. Deve ser desativado em `prefers-reduced-motion` e em mobile (onde o scroll é jerárquico e o efeito confunde).

### 12.6 Integração com o Dispositivo

- **MUST** — em dispositivos **touch** (sem `pointermove` contínuo), usar o **giroscópio** (`deviceorientation`) como fonte de paralaxe, com permissão apenas após interação do usuário.
- **SHOULD** — a amplitude do giroscópio ser **menor** (60% da do mouse) — o movimento do corpo é mais impreciso e um offset alto enjoa.
- **MUST NOT** — pedir permissão de giroscópio automaticamente ao carregar a página.

### 12.7 Integração com a Cena 3D

O mesmo `nx`/`ny` normalizado **MUST** alimentar:
1. A câmera 3D (§11.5).
2. O parallax 2D (§12.3, §12.4).
3. A posição do "reflexo" especular no papel (um gradiente que se move).

**MUST** — as três **MUST** usar a **mesma** fonte de verdade (um único `usePointer()` hook com `useRef` + subscribers), garantindo sincronia perfeita.

---
## 13. Especificação do Algoritmo de CPF

### 13.1 Regras Formais

Um CPF válido **MUST** satisfazer **todas** as condições:

| # | Condição | Descrição |
|---|---|---|
| C1 | 11 dígitos | Apenas caracteres `[0-9]`, exatamente 11 |
| C2 | DV₁ correto | Primeiro dígito verificador |
| C3 | DV₂ correto | Segundo dígito verificador |
| C4 | Não-sequencial | Não é todos os dígitos iguais nem uma sequência aritmética |
| C5 | Não-repetido | Não é `111.111.111-11`, `000.000.000-00`, etc. |

### 13.2 Cálculo do Dígito Verificador

**Primeiro DV (10º dígito):**

```
soma = Σ (d[i] × (10 - i))   para i de 0 a 8
resto = soma % 11
dv1   = resto < 2 ? 0 : 11 - resto
```

**Segundo DV (11º dígito):**

```
soma = Σ (d[i] × (11 - i))   para i de 0 a 9
resto = soma % 11
dv2   = resto < 2 ? 0 : 11 - resto
```

**Exemplo de trabalho (`111.444.777-35`):**

| Passo | Cálculo | Resultado |
|---|---|---|
| DV₁ | 1×10 + 1×9 + 1×8 + 4×7 + 4×6 + 4×5 + 7×4 + 7×3 + 7×2 = 162 | 162 % 11 = 8 → dv = 11-8 = **3** |
| DV₂ | 1×11+1×10+1×9+4×8+4×7+4×6+7×5+7×4+7×3+3×2 = 204 | 204 % 11 = 6 → dv = 11-6 = **5** |
| Esperado | — | `111.444.777-35` |

> **CPFs de teste canônicos (MUST** estar nos botões de amostras**):**
> - **Válido:** `529.982.247-25` (dv1=2, dv2=5) e `111.444.777-35` (dv1=3, dv2=5)
> - **Dígito incorreto:** `529.982.247-26` (DV₂ errado; esperado 5)
> - **Sequencial:** `123.456.789-09` (dv1=0, dv2=9 conferem, mas é progressão aritmética)
> - **Repetido:** `111.111.111-11` (dv1=1, dv2=1 conferem, mas todos os dígitos são iguais)

### 13.3 Detecção de Sequencial/Repetido

Um CPF é considerado **não emitido** quando:

1. **Todos os 9 dígitos base são iguais** (`000000000`, `111111111`, … `999999999`), ou
2. **Os 9 dígitos base formam uma progressão aritmética** de razão ±1 (`123456789`, `987654321`, `012345678`, `234567890`, …).

**MUST** — a verificação **MUST** ocorrer apenas se C2 e C3 passarem (o CPF só é "sequencial" se o cálculo bater; caso contrário, o motivo é o DV).

### 13.4 Motivos de Rejeição (taxonomia)

| Código | Motivo | Texto do carimbo | Texto do veredito |
|---|---|---|---|
| `EMPTY` | Nada digitado | — | — |
| `INCOMPLETE` | Menos de 11 dígitos | — | "Faltam {n} dígitos." |
| `INVALID_CHARS` | Caracteres não numéricos | — | "O CPF deve conter apenas números." |
| `INVALID_LENGTH` | Mais de 11 dígitos | — | "O CPF tem 11 dígitos; você digitou {n}." |
| `INVALID_DV1` | 10º dígito errado | `NÃO CONFORME` | "O 10º dígito verificador esperado é {dv}, mas foi {found}." |
| `INVALID_DV2` | 11º dígito errado | `NÃO CONFORME` | "O 11º dígito verificador esperado é {dv}, mas foi {found}." |
| `SEQUENTIAL` | Sequencial/repetido | `CPF SEM EMISSÃO` | "Os dígitos conferem, mas o número é sequencial — a Receita Federal nunca emitiu este CPF." |
| `VALID` | Tudo certo | `SELO DE CONFORMIDADE` | "Os dígitos verificadores conferem." |

### 13.5 API do Módulo de Validação

```ts
export type CpfStatus =
  | 'EMPTY' | 'INCOMPLETE' | 'INVALID_CHARS' | 'INVALID_LENGTH'
  | 'INVALID_DV1' | 'INVALID_DV2' | 'SEQUENTIAL' | 'VALID'

export interface CpfResult {
  status: CpfStatus
  isValid: boolean          // true apenas para 'VALID'
  formatted: string         // '000.000.000-00' (parcial: '000.000.000' se incompleto)
  digits: string            // apenas dígitos
  expected: { dv1: number; dv2: number } | null
  found: { dv1: number; dv2: number } | null
  reason: string            // micro-copy pronto para exibição
  announcement: string      // frase única para aria-live
}

export function validateCpf(input: string): CpfResult
export function formatCpf(input: string): string
export function onlyDigits(input: string): string
export function isSequential(digits: string): boolean
```

**MUST** — `validateCpf` **MUST** ser ** pura** (sem efeitos colaterais, sem Date, sem Math.random) e **MUST NOT** lançar exceções. **MUST** retornar `EMPTY` para string vazia/whitespace.

### 13.6 Normalização do Input

- **MUST** — remover tudo que não for dígito (`\D`).
- **MUST** — limitar a 11 dígitos (ignorar entradas excedentes).
- **MUST** — formatar progressivamente durante a digitação: `000.000.000-00` (máscara em tempo real, cursor nunca "salta").
- **MUST** — o `input` ter `inputMode="numeric"`, `autoComplete="off"`, `spellCheck={false}`.
- **MUST** — `type="text"` (não `number`) — `type="number"` causa problemas de scroll e não permite máscara.

### 13.7 Referência Cruzada

| Caso | Resultado esperado |
|---|---|
| `''` | `EMPTY` |
| `'abc'` | `INVALID_CHARS` |
| `'123'` | `INCOMPLETE` (faltam 8) |
| `'123456789012'` | `INVALID_LENGTH` |
| `'11111111111'` | `SEQUENTIAL` (os DVs conferem; todos os dígitos são iguais) |
| `'12345678909'` | `SEQUENTIAL` (os DVs conferem; progressão aritmética) |
| `'11144477735'` | `VALID` |
| `'52998224725'` | `VALID` |
| `'52998224726'` | `INVALID_DV2` (esperado 5, encontrado 6) |
| `'11144477734'` | `INVALID_DV2` (esperado 5, encontrado 4) |

---
## 14. Inventário de Componentes

### 14.1 Árvore de Componentes

```
<App>
├─ <Scene3D />              ← Three.js imperativo (useEffect)
├─ <Vignette />
├─ <Masthead />
│   └─ <SealEmblem />       ← SVG de latão com brilho animado
├─ <Station />              ← área de digitação
│   ├─ <CpfField />
│   │   ├─ <input />
│   │   ├─ <ClearButton />
│   │   └─ <CopyButton />
│   ├─ <ActionRow />
│   └─ <SampleRow />        ← botões de CPF de exemplo
├─ <Document />              ← o papel
│   ├─ <DocHeader />
│   ├─ <CpfHero />           ← CPF grande, com stagger por caractere
│   ├─ <Stamp />             ← O CARIMBO (SVG + coreografia)
│   └─ <DocFooter />
├─ <Verdict />
│   ├─ <VerdictTitle />
│   ├─ <VerdictReason />
│   └─ <RuleBreakdown />     ← <details> com os DVs
├─ <Colophon />              ← disclaimer
└─ <LiveRegion />            ← aria-live
```

### 14.2 Especificação dos Componentes-Chave

#### `<Stamp />` — O Carimbo

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `status` | `CpfStatus` | `'INCOMPLETE'` | Estado que define a arte |
| `cpf` | `string` | `''` | CPF formatado a estampar |
| `seed` | `number` | `Date.now() % 1000` | Semente de aleatoriedade (rotação, granulação, assinatura) |

**Contrato de renderização:**

- É um `<svg viewBox="0 0 320 320">` com `width: 100%`, `max-width: 320px`.
- **MUST** ter `role="img"` e `aria-label` = texto do veredito.
- Usa `<defs>` com filtros de granulação e deslocamento.
- **MUST** aplicar `mix-blend-mode: multiply` sobre o papel (a tinta interage com a textura do papel).
- **MUST** ter `filter: drop-shadow(...)` para a sombra projetada, **separada** do `box-shadow` do elemento (SVG não tem box-shadow).

**Estrutura SVG interna:**

```
<svg viewBox="0 0 320 320">
  <defs>
    <filter id="ink-bleed">   feTurbulence + feDisplacementMap
    <filter id="grain">       feTurbulence + feColorMatrix
    <path id="arc-top" d="M 60 160 A 100 100 0 0 1 260 160" />   ← texto em arco
    <path id="arc-bottom" d="M 62 168 A 98 98 0 0 0 258 168" />
  </defs>

  <g class="stamp-body">
    <rect x="8" y="8" width="304" height="304" rx="6" />          ← borda externa
    <rect x="18" y="18" width="284" height="284" rx="4" />        ← anel interno
    <text><textPath href="#arc-top">REGISTRO GERAL DE DOCUMENTOS</textPath></text>
    <g class="emblem">…estrela…</g>
    <text class="verdict-text">SELO DE CONFORMIDADE</text>
    <text><textPath href="#arc-bottom">BRASIL · 2026</textPath></text>
    <path class="signature" d="M 90 250 C 120 230, 150 275, 200 245" />
  </g>
</svg>
```

#### `<CpfHero />` — O CPF no Papel

- Renderiza o CPF com `stagger` de 28ms por caractere (P-TYPE).
- Dígitos **não digitados** renderizados como `·` em `--ink-400` a 30% de opacidade.
- **MUST** usar `aria-hidden` (o texto do carimbo e o `LiveRegion` já anunciam o estado).

#### `<CpfField />` — O Campo

- `<input type="text" inputMode="numeric" maxLength={14}>` (14 = 11 dígitos + 3 separadores).
- Máscara aplicada via `onChange` → `setValue(formatCpf(onlyDigits(e.target.value)))`.
- **MUST** manter o cursor no final após a máscara (usando `setSelectionRange`).
- Focus ring: **anel de latão** de 2px + halo `box-shadow: 0 0 0 4px rgba(200,162,74,.25)`.
- **MUST** — o campo **MUST** ter um "sucessor" animado: um pequeno cursor tipo carimbo (bloco `▌` de latão) que pisca.

#### `<Scene3D />` — A Cena

- Componente **imperativo**: cria `WebGLRenderer` num `useEffect`, retorna um `<canvas>`.
- Comunica estado para a cena via `useRef` (nunca via props re-render — evitar re-render a 60fps).
- API: `{ status, reducedMotion, onImpact }` onde `onImpact` dispara o shake.

#### `<RuleBreakdown />` — A Explicação Técnica

`<details>` nativo (sem JS) com:

- Tabela: `Dígito`, `Esperado`, `Encontrado`, `Situação`.
- Fórmulas dos DVs em `<code>`.
- **MUST** ser um `<details>` nativo para ter teclado e semântica de graça.

### 14.3 Inventário de Estados Visuais por Componente

| Componente | `EMPTY` | `INCOMPLETE` | `VALID` | `INVALID` | `SEQUENTIAL` |
|---|---|---|---|---|---|
| `CpfField` | placeholder visível | digits | borda verde-tinta | borda vermelha-tinta | borda vermelha-tinta |
| `Document` | oculto | visível | visível | visível | visível |
| `Stamp` | oculto | fantasma 20% | selo verde | não conforme | sem emissão |
| `Verdict` | oculto | contagem de dígitos | texto + quebra | texto + quebra | texto + quebra |

---
## 15. Acessibilidade (WCAG 2.2 AA)

### 15.1 Princípio Guia

> O carimbo é uma **experiência visual**. Para quem não pode vê-lo (cego, baixa visão, daltonismo), existe uma **experiência textual equivalente** que carrega exatamente a mesma informação. Nenhuma informação **MAY** existir apenas no canal visual.

### 15.2 Checklist WCAG 2.2 AA

| Critério | Nível | Como é atendido |
|---|---|---|
| 1.1.1 Conteúdo Não Textual | A | Carimbo tem `role="img"` + `aria-label`; cena 3D é `aria-hidden` |
| 1.3.1 Info e Relações | A | `<label>` real ligado ao input; `<details>`/`<summary>` semânticos |
| 1.4.3 Contraste (Mínimo) | AA | Corpo ≥ 4.5:1; texto grande ≥ 3:1 sobre o papel |
| 1.4.4 Redimensionar Texto | AA | Tudo em `rem` / `clamp()`; zoom 200% sem perda |
| 1.4.10 Reflow | AA | Layout reflowa em 320px sem scroll horizontal |
| 1.4.11 Non-text Contrast | AA | Borda do input e do carimbo ≥ 3:1 |
| 1.4.12 Espaçamento de Texto | AA | `line-height: 1.6` no corpo, sem altura fixa |
| 2.1.1 Teclado | A | Todo controle focável; `details` nativo |
| 2.2.2 Pausar/Parar | A | Cena 3D pausa em `visibilitychange`; sem auto-scroll |
| 2.3.3 Animação por Interação | AAA | `prefers-reduced-motion` respeitado |
| 2.4.3 Ordem de Foco | A | Ordem visual = ordem de tabulação |
| 2.4.6 Títulos e Rótulos | AA | Labels descritivos ("CPF", "Copiar CPF formatado") |
| 2.5.8 Tamanho do Alvo | AA | Botões ≥ 44×44px |
| 3.1.2 Idioma da Parte | AA | `lang="pt-BR"` no `<html>` |
| 3.2.2 Ao Entrar | A | Nenhuma mudança de contexto automática |
| 3.3.1 Identificação de Erro | A | O motivo do erro é descrito em texto, não só cor |
| 4.1.2 Nome, Papel, Valor | A | `aria-live`, `aria-expanded`, `aria-label` corretos |

### 15.3 Foco Visível

- **MUST** — o anel de foco **MUST** ser de **2px em latão** (`--brass-500`), com offset 3px, e **MUST NOT** ser removido sem substituto.
- **MUST** — o foco **MUST** ser visível mesmo sobre o papel (usar `outline-offset` + uma segunda camada escura para contraste em qualquer fundo).

### 15.4 Região Viva (aria-live)

```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- announcement -->
</div>
```

- **MUST** — `polite` (não `assertive`) para não interromper.
- **MUST** — `aria-atomic="true"` para anunciar a frase inteira.
- **MUST** — a região **MUST** ser `sr-only` (visualmente oculta, mas não `display:none`).
- **MUST** — anunciar **apenas quando o estado muda** (evitar spam a cada tecla).

### 15.5 Movimento Reduzido

- **MUST** — implementar detecção de `prefers-reduced-motion` via `matchMedia('(prefers-reduced-motion: reduce)')` com `addEventListener('change')`.
- **MUST** — a detecção **MUST** ser reativa (mudar a preferência em runtime **MUST** ter efeito imediato).
- **SHOULD** — expor um **toggle manual** na UI ("Reduzir movimento"), que sobrescreve a preferência do sistema, com persistência em `localStorage`.

### 15.6 Alvos de Toque e Mobile

- **MUST** — todos os botões ≥ 44×44px.
- **MUST** — o input ter `font-size: 16px` **mínimo** (evita zoom automático no iOS).
- **MUST** — em mobile, o carimbo **MUST** ser redimensionado, nunca cortado.

### 15.7 Teste de Escala de Cinza

**MUST** — o resultado **MUST** ser identificável sem cor. Garantido por:

1. Título em texto no carimbo ("SELO DE CONFORMIDADE" / "NÃO CONFORME" / "CPF SEM EMISSÃO").
2. Forma distinta: anel fechado vs. anel com gap vs. anel com riscada.
3. Símbolo central distinto: estrela vs. X vs. traço.
4. Texto de veredito completo fora do carimbo.

---
## 16. Performance e Orçamento de Frames

### 16.1 Orçamentos

| Métrica | Orçamento | Como medir |
|---|---|---|
| JS inicial (gzip) | ≤ 220 KB | `bundlephobia` / build output |
| CSS (gzip) | ≤ 18 KB | build output |
| Total no primeiro load | ≤ 260 KB | sem fontes blocking |
| LCP | ≤ 2.0s (4G) | Lighthouse |
| CLS | ≤ 0.05 | Lighthouse |
| INP | ≤ 200ms | Lighthouse |
| Frame time p95 (durante o carimbo) | ≤ 16.7ms | Performance API |
| Time to First Stamp (após 11º dígito) | ≤ 100ms | marca `performance.now()` |

### 16.2 Estratégia de Carregamento

- **MUST** — as fontes **MUST** ser carregadas com `font-display: swap` e `preconnect` para `fonts.gstatic.com`.
- **MUST** — a cena 3D **MUST** ser inicializada **após** o primeiro paint (`requestIdleCallback` ou `setTimeout(0)` após `onload`), para não bloquear o LCP.
- **MUST** — o **carimbo** (o elemento mais importante) **MUST** estar pronto **antes** da cena 3D.
- **SHOULD** — a cena 3D **MAY** ser carregada sob demanda (após a primeira interação).
- **MUST** — a validação **MUST NOT** depender do carregamento da cena 3D.

> **Uniformização da política de fontes (decisão v1.0).** O carregamento das fontes do Google é a **única** requisição de rede feita pelo produto, e ela ocorre apenas para tipografia — nunca carregada ou relacionada ao CPF. Para eliminate-la por completo, o projeto **MUST** oferecer fontes de sistema equivalentes, já declaradas como *fallback* em `src/styles/tokens.css`:
>
> | Papel | Fonte remota | Fallback local (obrigatório) |
> |---|---|---|
> | Display (`--font-display`) | Cormorant Garamond | `Times New Roman`, `serif` |
> | Corpo (`--font-body`) | Inter | `system-ui`, `-apple-system`, `Segoe UI`, `sans-serif` |
> | Mono (`--font-mono`) | JetBrains Mono | `ui-monospace`, `SFMono-Regular`, `monospace` |
>
> **MUST** — o layout **MUST** permanecer legível e sem quebra com as fontes de fallback (a interface não depende de métricas exatas das fontes remotas).
> **MUST** — nenhuma fonte **MAY** carregar dados de usuário no `referer`; o `index.html` já declara `<meta name="referrer" content="no-referrer">`.
> **SHOULD** — sob uma CSP restritiva (§21.4), as fontes remotas **MAY** ser desativadas; o produto **MUST** continuar plenamente funcional e legível.


### 16.3 Otimizações da Cena 3D

| Técnica | Regra |
|---|---|
| Pixel ratio | Cap em 2 |
| Partículas | 600 desktop, **200 mobile** |
| Geometria | Reutilizar instâncias; sem alocação por frame |
| Materiais | Reutilizar os mesmos objetos; nunca criar em loop |
| Sombras | `shadowMap` desligado no mobile; usar apenas a sombra "fake" do papel em CSS |
| Tone mapping | ACES (1 passe) |
| Loop | Pausar em `document.hidden` |
| Redimensionamento | Debounce de 150ms |

**MUST** — o loop 3D **MUST NOT** alocar objetos por frame (vectors temporários **MUST** ser reutilizados ou o cálculo **MUST** ser inline).

### 16.4 Otimizações da Camada 2D

- **MUST** — filtros SVG (`feTurbulence`) **MUST** ser declarados **uma única vez** em `<defs>` e reutilizados via `filter="url(#id)"`.
- **MUST** — `feDisplacementMap` **MUST NOT** ser aplicado a elementos com `will-change: transform` durante a animação do carimbo (custo elevado).
- **SHOULD** — usar `transform` e `opacity` apenas (propriedades aceleradas por hardware) nas animações.
- **MUST** — remover `will-change` após a animação (`will-change: auto`) para não desperdiçar memória de GPU.
- **MUST** — o `backdrop-filter` ser aplicado apenas no elemento do input (não na página inteira).

### 16.5 Métricas de Framerate

- **MUST** — a cena 3D **MUST** rodar a 60fps em desktop e 30fps (mínimo) em mobile.
- **MUST** — a coreografia do carimbo **MUST** ser **frame-rate independent** (baseada em `duration` do Motion, não em contagem de frames).
- **SHOULD** — se o device ficar abaixo de 45fps por 2s, reduzir partículas automaticamente.

---
## 17. Arquitetura Técnica

### 17.1 Stack

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Build | Vite | ^5.4 | Dev server rápido, build ESM, code-splitting nativo |
| UI | React | ^18.3 | Padrão de mercado, `useSyncExternalStore` disponível |
| Linguagem | TypeScript | ^5.5 | Tipagem estrita do resultado da validação |
| Motion | `motion` (framer-motion v11) | ^11.11 | Orquestração de animação declarativa, `AnimatePresence`, springs |
| 3D | `three` | ^0.169 | Controle imperativo fino, sem R3F (ver §11.9) |
| Testes | `vitest` + `@testing-library/react` | ^2.0 | Runner compatível com Vite, zero config extra |
| Fontes | Google Fonts (Special Elite, IBM Plex) | — | `display=swap` |

### 17.2 Estrutura de Pastas

```
cpf-validator/
├─ docs/
│  ├─ SDD.md                  ← este documento
│  └─ DESIGN-TOKENS.md        ← tokens extraídos
├─ public/
│  └─ favicon.svg             ← o brasão em latão
├─ src/
│  ├─ main.tsx                ← entry point
│  ├─ App.tsx                 ← composição raiz
│  ├─ styles/
│  │  ├─ tokens.css           ← variáveis CSS (cor, tipografia, motion, espaço)
│  │  ├─ global.css           ← reset + tipografia base + utilitários
│  │  └─ textures.css         ← filtros SVG de textura (data-URI)
│  ├─ lib/
│  │  ├─ cpf.ts               ← algoritmo de validação (PURO, testável)
│  │  ├─ cpf.test.ts          ← testes unitários do algoritmo
│  │  ├─ motion.ts            ← tokens de motion + primitivas reutilizáveis
│  │  └─ seed.ts              ← PRNG determinístico (mulberry32)
│  ├─ hooks/
│  │  ├─ usePointer.ts        ← fonte única de verdade do ponteiro
│  │  ├─ useReducedMotion.ts  ← matchMedia reativa + override manual
│  │  ├─ useCpfValidation.ts  ← estado + debounce de 120ms
│  │  └─ useIsomorphicLayoutEffect.ts
│  ├─ three/
│  │  ├─ createScene.ts       ← setup de renderer/cena/luz
│  │  ├─ woodTexture.ts       ← textura procedural da mesa
│  │  ├─ dust.ts              ← sistema de partículas
│  │  └─ types.ts
│  ├─ components/
│  │  ├─ Scene3D.tsx
│  │  ├─ Vignette.tsx
│  │  ├─ Masthead.tsx
│  │  ├─ SealEmblem.tsx
│  │  ├─ Station.tsx
│  │  ├─ CpfField.tsx
│  │  ├─ Document.tsx
│  │  ├─ CpfHero.tsx
│  │  ├─ Stamp.tsx            ← o carimbo (coreografia)
│  │  ├─ Verdict.tsx
│  │  ├─ RuleBreakdown.tsx
│  │  ├─ Colophon.tsx
│  │  ├─ LiveRegion.tsx
│  │  └─ ImpactFlash.tsx
│  └─ tests/
│     └─ setup.ts
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
└─ README.md
```

### 17.3 Arquitetura de Estado

**Princípio:** o estado de validação é **derivado**, não armazenado.

```
useCpfValidation(rawDigits)
   └─ useMemo(() => validateCpf(digits), [digits])   ← única fonte de verdade
        └─ { status, isValid, formatted, expected, found, reason, announcement }
```

- **MUST** — `status` **MUST** ser **derivado** por `useMemo` a partir dos dígitos, nunca armazenado em state separado (evita dessincronização).
- **MUST** — a cena 3D **MUST** receber o status via `useRef` + subscription (não via re-render de props).
- **MUST** — o texto do carimbo, o título do veredito e a mensagem do `aria-live` **MUST** derivar do **mesmo** objeto `CpfResult` (fonte única de verdade).

### 17.4 Ponte React ↔ Three.js

```ts
// Padrão: o React não re-renderiza a 60fps.
// Um "store" externo mínimo com useSyncExternalStore.
class SceneStore {
  private state = { status: 'EMPTY', pointer: { x: 0, y: 0 } }
  subscribe(fn) { ... }
  getSnapshot = () => this.state
}
```

- **MUST** — a cena 3D **MUST NOT** provocar re-render do React a cada frame.
- **MUST** — o `pointer` **MUST** ser armazenado em `useRef` e lido no loop 3D.

### 17.5 Sistema de Motion (implementação)

```ts
// src/lib/motion.ts
export const SPRING = { type: 'spring', stiffness: 420, damping: 26, mass: 1.1 } as const
export const SPRING_SOFT = { type: 'spring', stiffness: 220, damping: 24 } as const
export const EASE_INK = [0.22, 1, 0.36, 1] as const
export const EASE_METAL = [0.16, 1, 0.3, 1] as const
export const SHAKE_KEYFRAMES = [0, -7, 6, -4, 2.5, -1, 0.5, 0]
export const DUR = { instant: 0.08, fast: 0.16, base: 0.26, slow: 0.45, stamp: 0.9 } as const
```

**MUST** — todas as constantes de motion **MUST** estar em um único arquivo, para que a coreografia seja auditável e consistente.

### 17.6 PRNG Determinístico (Granulação e Inclinação)

```ts
// src/lib/seed.ts
export function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

- **MUST** — a rotação, a granulação e a assinatura do carimbo **MUST** vir de um PRNG semeado pelo `seed` (nunca `Math.random()` direto), para que o mesmo `seed` produza sempre o mesmo carimbo (testável e reproduzível).
- **SHOULD** — o `seed` ser gerado uma vez por sessão (`useState(() => Date.now() % 100000)`).

### 17.7 Estratégia de Error Boundary

- **MUST** — a `<Scene3D />` **MUST** estar dentro de um `<ErrorBoundary>` que, ao falhar, renderiza o **fallback CSS** (§11.8) e **não** derruba a aplicação.
- **MUST** — erros na camada 2D **MUST** ser logados no console com contexto, mas **MUST NOT** aparecer para o usuário como tela branca.

---
## 18. Modelo de Dados e Persistência

### 18.1 Princípio: Zero Persistência de Dados Sensíveis

**MUST NOT** — o CPF digitado **MUST NOT** ser enviado a nenhum servidor, nem armazenado em `localStorage`, `sessionStorage`, `IndexedDB` ou cookies.

**MUST** — o CPF vive **apenas** no estado React em memória. Ao fechar/recarregar a aba, ele desaparece.

### 18.2 O Que É Persistido

| Dado | Onde | Motivo | TTL |
|---|---|---|---|
| Preferência "reduzir movimento" | `localStorage['cdcpf:reduced-motion']` | Preferência de acessibilidade (não é dado pessoal) | Permanente |
| Seed do carimbo da sessão | `useState` em memória | Reprodutibilidade visual | Sessão |

**MUST** — nenhuma requisição de rede **MAY** conter o CPF (mesmo em telemetria de erro). **MUST** — o Sentry (se usado) **MUST** ter um `beforeSend` que remove qualquer valor que case com o padrão de CPF (`\d{3}\.?\d{3}\.?\d{3}-?\d{2}`).

### 18.3 Formato de Exceções (Backend futuro)

O formato de saída do módulo de validação **MUST** ser serializável para uso futuro em API:

```json
{
  "cpf": "529.982.247-25",
  "valid": true,
  "status": "VALID",
  "reason": "Os dígitos verificadores conferem.",
  "checkDigits": { "expected": [2, 5], "found": [2, 5] }
}
```

---
## 19. Tratamento de Erros e Casos Limite

### 19.1 Casos Limite de Entrada

| Entrada | Comportamento esperado |
|---|---|
| `''` (vazio) | Estado `EMPTY`. Documento oculto. Nenhum carimbo. |
| `'   '` (só espaços) | `EMPTY` (aplicar `trim`). |
| `'abc'` | `INVALID_CHARS`. Input aceita a letra mas o estado mostra erro; ao digitar, as letras são filtradas. |
| `'123456789012'` (12+) | `INVALID_LENGTH`. Máscara limita a 11 dígitos. |
| `'529.982.247-25'` (colado formatado) | Normalizado e validado como `VALID`. |
| `'52998224725'` (colado sem máscara) | Idem. |
| `'529.982.247-2'` (10 dígitos) | `INCOMPLETE`, faltam 1. |
| `'á'` (unicode) | Filtrado. `onlyDigits` remove. |
| `'00000000000'` | `SEQUENTIAL` (dv1=0, dv2=0 conferem; todos iguais). |
| `'99999999999'` | `SEQUENTIAL`. |
| `'98765432100'` | `SEQUENTIAL` (progressão decrescente). |

### 19.2 Casos Limite de UI

| Caso | Tratamento |
|---|---|
| WebGL indisponível | Fallback CSS (§11.8). Nenhum erro visível. |
| `prefers-reduced-motion` | Modo simplificado (§7.5). |
| Janela redimensionada durante a animação | O carimbo **MUST** reposicionar sem "pular" (usar `%` para posicionamento). |
| Aba em background | Loop 3D pausa; animações CSS/Motion **MAY** continuar (o navegador as pausa). |
| Múltiplas abas | Cada uma tem seu próprio seed e estado. Sem `localStorage` compartilhado (exceto a preferência de movimento). |
| Colagem de um CPF com espaços/newlines | `onlyDigits` remove. |
| IME (teclado japonês/chinês) | `onChange` em vez de `onKeyDown` — funciona com IME. |
| Teclado só-numérico em mobile | `inputMode="numeric"` + filtro. |
| Impressão da página | **SHOULD** — `@media print` **MUST** esconder a cena 3D e a vinheta, e imprimir o CPF + veredito em preto e branco legível. |

### 19.3 Erros Internos

- **MUST** — `validateCpf` **MUST NOT** lançar. Entradas inesperadas (ex.: `null` vindo de JS) **MUST** ser tratadas retornando `EMPTY`.
- **MUST** — a cena 3D **MUST** ser destruída corretamente no `useEffect` cleanup (`renderer.dispose()`, `geometry.dispose()`, `material.dispose()`, remover listeners, `cancelAnimationFrame`).

---
## 20. Plano de Testes

### 20.1 Pirâmide de Testes

| Camada | Ferramenta | Cobertura-alvo | Foco |
|---|---|---|---|
| **Unitário** | Vitest | 100% de `src/lib/cpf.ts` | Algoritmo de DV, sequencial, formatação |
| **Integração** | Vitest + Testing Library | Componentes chave | Renderização por estado, `aria-live`, máscara do input |
| **E2E (leve)** | Playwright (opcional, v1.1) | 3 fluxos | Digitar → carimbo; reduced-motion; mobile |
| **Visual (manual)** | Checklist | — | Ver §20.4 |
| **Performance** | Lighthouse CI | Orçamentos §16.1 | Regressão de bundle e frame rate |

### 20.2 Casos de Teste do Algoritmo (obrigatórios)

```ts
describe('validateCpf', () => {
  it('retorna EMPTY para string vazia', ...)
  it('retorna EMPTY para espaços', ...)
  it('retorna INVALID_CHARS para letras', ...)
  it('retorna INCOMPLETE com a contagem de dígitos faltantes', ...)
  it('retorna INVALID_LENGTH acima de 11 dígitos', ...)
  it('retorna VALID para 11144477735', ...)
  it('retorna VALID para 52998224725', ...)
  it('retorna INVALID_DV1 quando o 10º dígito não confere', ...)
  it('retorna INVALID_DV2 quando o 11º dígito não confere', ...)
  it('retorna SEQUENTIAL para 12345678909', ...)
  it('retorna SEQUENTIAL para 11111111111', ...)
  it('retorna SEQUENTIAL para 00000000000', ...)
  it('retorna SEQUENTIAL para 98765432100', ...)
  it('formata parcialmente conforme digita', ...)
  it('nunca lança exceção', ...)
  it('é pura: duas chamadas com a mesma entrada dão o mesmo resultado', ...)
})
```

**MUST** — a suíte **MUST** cobrir os 8 estados da taxonomia (§13.4).

### 20.3 Testes de Componente

| Teste | Assertiva |
|---|---|
| `<CpfField>` | Digitar `'529'` produz `'529'`; digitar `'5a2'` produz `'52'`; colar `'529.982.247-25'` produz o valor formatado |
| `<Stamp status="VALID">` | Renderiza texto "SELO DE CONFORMIDADE" e `role="img"` com `aria-label` |
| `<Stamp status="INVALID">` | Renderiza "NÃO CONFORME" |
| `<Stamp status="SEQUENTIAL">` | Renderiza "CPF SEM EMISSÃO" e o elemento da riscada |
| `<LiveRegion>` | Contiene a frase de anúncio quando o status muda |
| `<App>` com reduced-motion | Nenhuma animação de squash é aplicada |

### 20.4 Checklist de Validação Visual Manual

- [ ] O carimbo tem **granulação de tinta** visível (não é um retângulo sólido).
- [ ] As bordas do carimbo são **irregulares** (não um retângulo perfeito).
- [ ] O carimbo tem **rotação** (nunca perfeitamente reto).
- [ ] A **sombra** se separa da forma durante a queda e colapsa no impacto.
- [ ] O impacto produz **squash** (o carimbo achata) e **tremor** (a tela treme).
- [ ] A **paralaxe** responde ao cursor com camadas em velocidades distintas.
- [ ] A cena 3D **congela a poeira** no instante do impacto.
- [ ] Sem WebGL → o fallback CSS mantém a mesma atmosfera.
- [ ] Com `prefers-reduced-motion` → sem squash, sem tremor, sem parallax.
- [ ] O resultado é legível em **escala de cinza**.
- [ ] Em 320px de largura → sem scroll horizontal.
- [ ] O CPF **nunca** aparece na aba Network.

---
## 21. Deployment

### 21.1 Build

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # pré-visualiza o build
npm run test     # vitest
```

### 21.2 Configuração

- **MUST** — `base: './'` no `vite.config.ts` para permitir deploy em subdiretório (GitHub Pages, subpasta).
- **MUST** — output de assets com hash no nome para cache-busting.
- **SHOULD** — `_headers` (Netlify) ou `vercel.json` com `Cache-Control: immutable` para assets com hash.
- **SHOULD** — `index.html` com `Cache-Control: no-cache`.

### 21.3 Opções de Hospedagem

| Plataforma | Notas |
|---|---|
| **Vercel** | Deploy via Git. `npm run build`, output `dist`. Zero config. |
| **Netlify** | Idem. Adicionar `_redirects` para SPA: `/* /index.html 200`. |
| **GitHub Pages** | Workflow de Actions; usar `base: './'`. |
| **Cloudflare Pages** | Build command `npm run build`, output `dist`. |

### 21.4 Considerações de Privacidade

- **MUST** — headers de segurança: `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: geolocation=(), camera=(), microphone=()` (e `gyroscope=()` se a câmera giroscópica não for usada).
- **SHOULD** — `Content-Security-Policy` restritiva: `default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'`.

> **Nota:** `style-src 'unsafe-inline'` é necessário porque Motion injeta estilos inline. `connect-src 'self'` garante que **nenhuma** requisição com o CPF seja possível.

---
## 22. Critérios de Aceitação (Definition of Done)

O feature está **pronto** quando **todos** os itens abaixo são verdadeiros.

> **Legenda.** `[x]` = verificado na implementação v1.0 (com teste automatizado ou conferência direta no código). `[ ]` = planejado, ainda **não** implementado. Item não implementado **NÃO** pode ser lido como "entregue".

### 22.1 Funcional

- [x] `validateCpf` cobre os 8 estados da taxonomia, em `src/lib/cpf.ts`, com testes para cada estado (`src/test/cpf.test.ts`).
- [x] A entrada formatada (`529.982.247-25`) é normalizada antes da validação.
- [x] A máscara do input mantém o cursor estável ao digitar, colar e apagar.
- [x] O carimbo muda de estado sem flicker ao validar CPFs em sequência rápida.
- [x] O botão "copiar" copia o CPF formatado e confirma visualmente.
- [x] O disclaimer sobre "não confirma existência na RFB" está sempre visível.

### 22.2 Design

- [x] O carimbo tem granulação, bordas irregulares, rotação semeada e sombra projetada.
- [x] O carimbo distingue o resultado **sem depender de cor**: anel + texto + símbolo central (§15.7).
- [x] A parallax funciona com velocidades distintas entre papel (L2) e carimbo (L3), compartilhando a fonte de verdade do ponteiro (§12.7).
- [ ] A coreografia completa (impacto → squash → tremor → bleed → anel → veredito) executa em ~900ms com a sequência P-SQUASH de 4 quadros.
- [ ] A parallax de scroll (L1) é implementada.
- [ ] A cena 3D congela a poeira no impacto — hoje a poeira apenas desacelera com a luz.
- [ ] A cena 3D ganha a variação de tom esverdeado/cinza do estado `SEQUENTIAL`.
- [ ] Auditoria visual com daltônicos reais (o teste automatizado cobre apenas a ausência de dependência de cor).

### 22.3 Acessibilidade

- [x] `prefers-reduced-motion` remove squash, tremor, parallax e loops de ambiente, com detecção reativa via `matchMedia`.
- [x] O estado é anunciado por `aria-live` em uma única frase.
- [x] Todos os controles são alcançáveis por teclado com foco visível.
- [x] O carimbo expõe `role="img"` + `aria-label`; a cena 3D é `aria-hidden`.
- [ ] Auditoria WCAG 2.2 AA formal (ferramenta externa + revisão manual de contraste real).

### 22.4 Performance

- [x] O Three.js é code-split em chunk próprio e carregado sob demanda; a validação não depende dele.
- [x] Zero requisições de rede com dados do CPF (verificado por teste automatizado).
- [ ] Bundle inicial ≤ 260 KB gzip — hoje: **121 KB gzip** (`index` + `motion`).
- [ ] LCP ≤ 2.0s em 4G simulado.
- [ ] CLS ≤ 0.05.
- [ ] 60fps durante a coreografia em desktop de referência.

### 22.5 Privacidade

- [x] Nenhum CPF em `localStorage`, `sessionStorage`, cookies ou requisições (verificado por teste automatizado).
- [x] Nenhum analytics ou telemetria no projeto.
- [x] O CPF vive apenas no estado React em memória (§18.1).
- [ ] Headers de segurança (§21.4) ainda não configurados no host de deploy.


---
## 23. Riscos e Mitigações

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | **"Efeito" ofusca "Informação"** — o usuário não entende se o CPF é válido | Média | **Alto** | Princípio P10; texto do veredito sempre visível; disclaimer permanente; teste com 5 usuários |
| R2 | A cena 3D **distrai** do carimbo | Média | Médio | Cena desfocada e com baixo contraste (§11.1); validação independente da 3D |
| R3 | **Performance** em máquinas fracas (60fps não atingido) | Média | Médio | Cap de pixel ratio, partículas reduzidas, `prefers-reduced-motion`, detecção automática de FPS baixo |
| R4 | **Validação de CPF ser usada para fins de compliance indevidos** | Baixa | **Alto** | Disclaimer explícito; sem alegação de "verificação oficial"; documentação clara |
| R5 | Usuário **espera** que o CPF exista na RFB | **Alta** | **Alto** | Disclaimer em 2 lugares + estado `SEQUENTIAL` diferenciado; nota de rodapé no README |
| R6 | **Fontes do Google** violando privacidade (requisição a terceiros) | Média | Médio | `preconnect` + `swap`; alternativa: self-host das fontes (recomendado sob CSP restritiva) |
| R7 | **Flicker** ao validar rapidamente vários CPFs | Média | Médio | Debounce de 120ms + `AnimatePresence` com `mode="popLayout"` (§8.4) |
| R8 | Carimbo **ilegível** em telas pequenas | Média | Alto | `clamp()` em toda a tipografia; carimbo escalado por `%`; teste em 320px |
| R9 | **Fadiga de movimento** (motion sickness) | Baixa | Alto | Amplitudes pequenas; parallax sutil; `prefers-reduced-motion` respeitado; toggle manual |
| R10 | Granulação do carimbo ficar **ruidosa demais** em DPI alto | Média | Baixo | Filtros SVG escalam com o elemento; ajustar `baseFrequency` por teste visual |
| R11 | **Bundle** crescer com Three.js | Baixa | Médio | `three` é ~150KB gzip; code-split da cena; se necessário, lazy-load por `import()` dinâmico |
| R12 | Sentry/telemetria **vazar CPF** | Baixa | **Alto** | `beforeSend` com regex de CPF; `connect-src 'self'` |

---

## 24. Roadmap

### v1.0 — "O Carimbo" (este documento)

- [x] Validação em tempo real com 8 estados (`src/lib/cpf.ts`).
- [x] Carimbo SVG com granulação, bordas irregulares, rotação semeada, sombra.
- [x] Cena 3D: mesa procedural, poeira, luz reativa, paralaxe de câmera.
- [x] Parallax 2D no papel e no carimbo, com fonte de verdade única do ponteiro.
- [x] Acessibilidade: `prefers-reduced-motion` reativo, `aria-live`, `role="img"`, teclado.
- [x] Testes unitários do algoritmo (26 casos em `src/test/cpf.test.ts`) e de interface (24 casos).
- [ ] Sequência P-SQUASH completa no impacto do carimbo (existe a constante, falta a coreografia).
- [ ] Parallax de scroll (L1) e tom esverdeado do estado `SEQUENTIAL` na cena 3D.


### v1.1 — "Refinamentos"

- [ ] Múltiplos designs de carimbo (seletores de estilo: "Clássico", "Fisco", "Moderno").
- [ ] Exportar o carimbo como PNG (o usuário baixa a imagem do seu CPF validado).
- [ ] Widget embutível (`<iframe>` 480×220).
- [ ] Endpoint `POST /api/validate` opcional (com aviso de LGPD).

### v1.2 — "Plataforma"

- [ ] Validadores adicionais: CNPJ, RG, CEP, PIS, cartão (Luhn).
- [ ] API pública documentada (OpenAPI).
- [ ] i18n (pt-BR, en, es).
- [ ] Modo "Lote": validar uma lista de CPFs colados e exportar CSV.

### v2.0 — "Cartório Completo"

- [ ] Persistência opcional de histórico (criptografado, opt-in, local).
- [ ] Relatório imprimível em PDF do registro.
- [ ] Assinatura digital do resultado.

---
## 25. Apêndices

### 25.1 Glossário

| Termo | Significado neste documento |
|---|---|
| **Carimbo** | O artefato visual principal que comunica o veredito |
| **Documento** | O elemento de papel (`<article class="document">`) que recebe o carimbo |
| **Estado** | O resultado da validação (`CpfStatus`) |
| **Coreografia** | A sequência temporal de animações do carimbo (§8) |
| **Primitiva** | Um movimento base reutilizável (§7.3) |
| **Impacto** | O quadro (~t=850ms) em que o carimbo atinge o papel |
| **Bleed** | A difusão de tinta no papel após o impacto |
| **Vinheta** | Escurecimento das bordas da tela (foco) |
| **Fallback** | Versão degradada que funciona sem WebGL |
| **Seed** | Semente do PRNG que torna o carimbo reproduzível |

### 25.2 Referência de Cores (Hex)

```
ink-900  #0E0B08   ink-800  #17120D   ink-700  #2A211A
ink-600  #4A3B2E   ink-400  #8A7660
paper-100 #F2EAD8  paper-200 #E7DBC4  paper-300 #D8C8AC
brass-500 #C8A24A  brass-600 #A8853A  gold-leaf #E7C56B
seal-green #1F6B4A seal-red #9E2B25
desk-900 #17120E   desk-700 #2E231A   void #080605
```

### 25.3 Constantes de Motion (Resumo)

```
SPRING       stiffness 420  damping 26  mass 1.1
SPRING_SOFT  stiffness 220  damping 24
EASE_INK     0.22, 1, 0.36, 1
EASE_METAL   0.16, 1, 0.30, 1
EASE_SETTLE  0.34, 1.56, 0.64, 1
DUR          0.08 / 0.16 / 0.26 / 0.45 / 0.90
SHAKE        0, -7, 6, -4, 2.5, -1, 0.5, 0  (420ms, linear)
STAMP_TILT   -9° … -4°  (seeded por sessão)
STAMP_SCALE  queda 1.35 → 1 ; impacto 1.24 / 0.74
PARALLAX     L0 0.55un | L1 8px | L2 16px | L3 26px
```

### 25.4 Glossário de Requisitos

| Keyword | Significado |
|---|---|
| **MUST** | Obrigatório. Violação = bug. |
| **MUST NOT** | Proibido. |
| **SHOULD** | Altamente recomendado; desviar requer justificativa. |
| **MAY** | Opcional, com degradação elegante. |

### 25.5 Índice de Referência Cruzada

| Seção do SDD | Implementação esperada |
|---|---|
| §6.1 Paleta | `src/styles/tokens.css` |
| §7 Motion | `src/lib/motion.ts` + `src/components/Stamp.tsx` |
| §8 Coreografia | `src/components/Stamp.tsx` (variantes) |
| §11 Cena 3D | `src/three/*` + `src/components/Scene3D.tsx` |
| §12 Parallax | `src/hooks/usePointer.ts` |
| §13 Algoritmo | `src/lib/cpf.ts` |
| §14 Componentes | `src/components/*` |
| §15 Acessibilidade | `src/hooks/useReducedMotion.ts` + `LiveRegion.tsx` |

### 25.6 Registro de Decisões (ADR resumido)

| ADR | Decisão | Alternativa rejeitada | Motivo |
|---|---|---|---|
| ADR-01 | Three.js imperativo, sem R3F | `@react-three/fiber` | Controle fino do loop, bundle menor, sem re-render a 60fps |
| ADR-02 | Sem backend, validação 100% client-side | API de consulta | Privacidade (LGPD), zero latência, zero custo |
| ADR-03 | Carimbo em SVG, não canvas 2D | `<canvas>` | Acessibilidade (`role="img"` + `aria-label`), nitidez em qualquer DPI, filtros e `pathLength` nativos |
| ADR-04 | Validação em 2 estágios (DV + sequencial) | Só o cálculo do DV | Evita dizer "válido" para CPFs de mentira (§1.1) |
| ADR-05 | Sem som no impacto | Efeito sonoro de carimbo | Carimbo real é silencioso; silêncio amplifica o peso (P7) |
| ADR-06 | Texturas procedurais (SVG/Canvas), zero assets | Imagens PNG/JPG | Zero requisições, escala infinita, bundle mínimo |
| ADR-07 | Debounce de 120ms na coreografia | Validação instantânea | Anti-flicker em colagem e digitação rápida (§8.4) |

---

**Fim do documento.**
*Versão 1.0.0 — 19/10/2026*
*Este SDD é a fonte de verdade do design. Qualquer alteração na implementação que conflite com ele deve ser refletida aqui primeiro.*

