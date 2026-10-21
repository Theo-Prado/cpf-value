# Cartório Digital de CPF

Validador de CPF com carimbo de cartório digital. Validação **local**, determinística e
privada — nenhum dado sai do seu navegador.

**Produção:** <https://cpf-validator-eight.vercel.app>

---

## Aviso

Este validador confere apenas a **coerência aritmética dos dígitos verificadores** e
detecta números sequenciais. Ele **não** verifica se o CPF está registrado na Receita
Federal e não substitui documento oficial.

A validação é **estrutural**, não **registral**.

## O que ele faz

- **Valida em dois estágios** — (A) dígito verificador matemático; (B) rejeição de
  CPFs sequenciais e repetidos (`111.111.111-11`, `123.456.789-09`), que passam no
  algoritmo mas nunca foram emitidos pela RFB.
- **Valida enquanto você digita** — sem botão "validar"; o veredito aparece em ≤ 1 frame
  após o 11º dígito.
- **Explica a regra** — expande os dois dígitos verificadores calculados, com os pesos
  oficiais em cada etapa.
- **Carimbo animado** — a mensagem primária do resultado, legível **sem depender de cor**
  (anel + texto + símbolo central).
- **Cena 3D procedural** — mesa de cartório em Three.js/WebGL com luz volumétrica e
  poeira em suspensão, reagindo à parallax do cursor.
- **Acessível** — WCAG 2.2 AA: `aria-live` anuncia o resultado, `prefers-reduced-motion`
  desativa parallax e squash, funciona 100% sem WebGL (fallback CSS/SVG).

## Privacidade

O CPF digitado vive **apenas na memória da aba**. Ele nunca é enviado, persistido,
registrado em log ou telemetrado. Recarregar ou fechar a página descarta o valor.

A única preferência persistida é o toggle de movimento reduzido
(`localStorage`, chave `cdcpf:reduced-motion`) — que não é dado pessoal.

Há um teste automatizado que garante isso: *"nunca persiste o CPF digitado"* e
*"não faz nenhuma requisição de rede durante a digitação"* (`src/test/app.test.tsx`).

## Stack

| Camada | Tecnologia |
|---|---|
| Build | Vite 7 + TypeScript 5.9 (strict) |
| UI | React 19 |
| Motion | Motion 14 (`motion/react`) |
| 3D | Three.js 0.186 (import dinâmico, sob demanda) |
| Testes | Vitest 3 + Testing Library + jsdom |
| Pacotes | pnpm 10 |

## Como rodar

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

### Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | `tsc -b` + build de produção em `dist/` |
| `pnpm preview` | Pré-visualiza o build de produção |
| `pnpm typecheck` | Checagem de tipos isolada |
| `pnpm test` | Suíte de testes (vitest) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm verify` | `tsc -b` + testes + build (gate completo) |

## Testes

```bash
pnpm test
```

50 testes cobrindo o algoritmo de CPF (8 estados da taxonomia), a coreografia de
parallax, a geração determinística do carimbo e a integração completa do `App`.

> O `vitest.config.ts` usa `fileParallelism: false`: o jsdom combinado com o Three.js
> consome muita memória quando vários arquivos de teste correm em paralelo, e o
> runner trava. Serializar os arquivos não altera o comportamento dos testes.

## Arquitetura

A regra arquitetural central é a separação em duas camadas:

1. **Camada 2D (Motion + DOM/SVG)** — a coreografia do carimbo. Carrega o peso
   emocional e a legibilidade. É **semântica e funcional**.
2. **Camada 3D (Three.js/WebGL)** — a mesa, o papel, a luz e a poeira. É **estética e
   responsiva**.

A camada 3D é carregada sob demanda via `import()` dinâmico, para não pesar no bundle
inicial. Se o WebGL não estiver disponível, o fallback CSS assume e o restante da
interface funciona igual.

### Estrutura

```
src/
  lib/cpf.ts        Algoritmo de validação (puro, determinístico)
  lib/stamp.ts      Arte do carimbo em SVG, com aleatoriedade semeada
  lib/motion.ts     Constantes de timing do Motion
  hooks/            usePointer (parallax), useReducedMotion
  three/scene.ts    Cena Three.js procedural
  components/       Interface React
  test/             Testes
```

## Deploy

Deploy em produção na **Vercel**: <https://cpf-validator-eight.vercel.app>

O `vercel.json` define `framework: vite`, `outputDirectory: dist` e os headers de
segurança exigidos pelo SDD (`Referrer-Policy: no-referrer`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`), além
de cache imutável de 1 ano para os assets com hash no nome.

O `package.json` fixa `"packageManager": "pnpm@10.34.7"` porque o `pnpm-workspace.yaml`
usa `allowBuilds` e `minimumReleaseAgeExclude` — chaves que só o pnpm 10 entende.

### GitHub Pages

O `vite.config.ts` já usa `base: './'`, então o build funciona em subdiretório. Para
publicar no GitHub Pages, basta um workflow de Actions que rode `pnpm build` e publique
o conteúdo de `dist/`.

## Documentação

- [`docs/SDD.md`](docs/SDD.md) — Software Design Document (1.794 linhas). Especifica
  produto, linguagem visual, sistema de motion, coreografia do carimbo, cena 3D,
  parallax, algoritmo de CPF, acessibilidade, arquitetura, privacidade e plano de
  testes. Seções marcadas com `MUST` são requisitos contratuais.
- `docs/DESIGN-TOKENS.md` — tokens de design. Referenciado pelo SDD, ainda não
  extraído para um arquivo próprio.

## Licença

Uso livre para fins válidos. O carimbo é um artefato visual, não um certificado oficial.
