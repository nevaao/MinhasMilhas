# Plano — Minhas Milhas (app de controle de pontos e milhas)

## Contexto
Hoje o controle é feito numa planilha (`Controle_de_milhas.xlsx`) com uma aba por programa (Livelo, Smiles, LATAM) e colunas: Descrição, Data, Entrada, Custo, Custo total, Milheiro da operação, Milheiro acumulado, Saída, Custo da saída, Pontos. A lógica é de **custo médio ponderado**:
- Entrada: `custo_total += custo`; `pontos += entrada`
- Saída: `custo_saida = saida × milheiro_acum_anterior / 1000`; `custo_total -= custo_saida`; `pontos -= saida`
- `milheiro_acumulado = custo_total / pontos × 1000`; `milheiro_operacao = custo / entrada × 1000`

Objetivo: app pessoal/familiar (estilo "Minhas Finanças") para celular e computador, repo `nevaao/Minhas Milhas` (vazio, só README). Branch: `claude/dazzling-shannon-mryyzo`.

Decisões do usuário: dados isolados por usuário; **PWA (React) + Supabase**; transferência herda custo médio da origem + custos extras, bônus como linha separada.

## Entregável imediato (após aprovação)
1. Publicar o plano como **Artifact HTML** (página em PT-BR, tema claro/escuro): visão geral, arquitetura (diagrama), modelo de dados, regras de cálculo com exemplo real da planilha (Smiles), wireframes das telas (Resumo, Registros, Novo registro, Contas, Categorias), roadmap por fases e custos (R$ 0 em free tiers).
2. Commitar o plano também em `docs/PLANO.md` no repositório e fazer push no branch.

## Arquitetura
- **Frontend**: Vite + React + TypeScript, Tailwind + shadcn/ui (minimalista), Recharts (gráfico), TanStack Query, React Hook Form + Zod, `vite-plugin-pwa` (instalável em Android/iOS/desktop, offline-read).
- **Backend**: Supabase — Postgres + Row Level Security (`user_id = auth.uid()`), Auth com e-mail/senha (magic link), Google e Azure (Microsoft).
- **Hospedagem**: Vercel ou Netlify (free) com deploy pelo GitHub.
- **Backup**: backups do Supabase + exportação/importação JSON/CSV/XLSX no app; opcional fase 3: backup automático para Google Drive.

## Modelo de dados (Postgres)
- `profiles(id, name, theme)`
- `accounts(id, user_id, name, program_type[banco|cia aérea|outro], color, icon, archived)`
- `categories(id, user_id, name, color, icon, kind[entrada|saida|ambos])`
- `transactions(id, user_id, account_id, category_id, type[entrada|saida|transferencia_out|transferencia_in|bonus|ajuste], date, description, points, cost, transfer_group_id, created_at)`
- View/função `account_ledger` calculando em ordem (date, created_at): custo da saída, custo total, pontos e milheiro acumulado — replicando as fórmulas da planilha. Cálculo também em `src/lib/ledger.ts` (função pura testada) para UI otimista.
- Transferência = transação atômica (RPC `create_transfer`): saída na origem (custo = pontos × milheiro origem), entrada no destino com custo herdado + extras, bônus opcional sem custo.

## Telas
- **Resumo**: cards por conta (pontos, milheiro acumulado, R$ investido), total geral, botão "+ Novo registro" (FAB), últimos 10 registros, gráfico combinado (barras = pontos, linha = milheiro) com filtro de conta e período.
- **Registros**: lista por mês com filtros (conta, categoria, tipo), editar/excluir.
- **Novo registro**: abas Entrada / Saída / Transferência; preview do novo milheiro antes de salvar.
- **Contas** e **Categorias**: CRUD com seletor de cor e ícone (lucide-react).
- **Configurações**: tema (claro/escuro/sistema), importar planilha XLSX (SheetJS, uma aba = uma conta), exportar dados, sair.

## Roadmap
- Fase 0: setup (Vite, Tailwind, Supabase, CI de lint/test, deploy).
- Fase 1 (MVP): auth, contas, categorias, registros, ledger, resumo + gráfico, tema.
- Fase 2: transferências com custo herdado, importação da planilha, PWA offline, exportação.
- Fase 3: backup Google Drive, metas/alertas de expiração de pontos.

## Arquivos-chave (a criar)
`src/lib/ledger.ts`, `src/lib/ledger.test.ts`, `supabase/migrations/0001_init.sql`, `src/pages/{Dashboard,Transactions,NewTransaction,Accounts,Categories,Settings}.tsx`, `src/components/PointsCostChart.tsx`, `src/lib/importXlsx.ts`.

## Verificação
- Testes Vitest de `ledger.ts` reproduzindo os valores da planilha (ex.: Smiles após "Passagem de volta de Bonito": 60 pontos, custo total 0,79, milheiro 13,245; LATAM após Bonito: 12.914 pontos, milheiro 6,343).
- Importar a planilha real e conferir saldos.
- Playwright: login, criar conta/registro, alternar tema, viewport mobile e desktop.
