# Minhas Milhas

Aplicativo pessoal (PWA) para controlar pontos e milhas de programas como Livelo, Smiles e LATAM Pass e calcular o valor do milheiro de cada conta. Plano completo em [`docs/PLANO.md`](docs/PLANO.md).

## Como configurar

1. **Banco de dados**: no painel do Supabase, abra *SQL Editor*, cole o conteúdo de `supabase/migrations/0001_init.sql` e execute.
2. **Login por e-mail**: em *Authentication → Sign In / Providers*, deixe *Email* ativo. Em *Authentication → URL Configuration*, informe a URL do app (e `http://localhost:5173` para desenvolvimento) em *Site URL* e *Redirect URLs*. Para testar mais rápido, desative *Confirm email*.
3. **Variáveis**: copie `.env.example` para `.env.local` e preencha a URL e a chave pública (publishable) do projeto.
4. **Rodar**:

```bash
npm install
npm run dev
npm test
```

## Viagens e avisos de promoção

A aba **Viagens** abre a busca com milhas já preenchida na Smiles, na LATAM Pass e na Azul Fidelidade, guarda destinos favoritos e avisa por notificação quando um blog de promoções cita um favorito. Os endereços de busca ficam em `src/lib/tripLinks.ts` (se algum site mudar o formato, ajuste só a função dele).

Configuração no Supabase (uma vez):

1. **Tabelas**: no *SQL Editor*, execute `supabase/migrations/0003_trips.sql`.
2. **Função**: em *Edge Functions → Deploy a new function → Via Editor*, crie `promo-watch`, cole o conteúdo de `supabase/functions/promo-watch/index.ts` e faça o deploy. Em *Details*, desligue **Verify JWT**.
3. **Agendamento**: em *Integrations → Cron → Create job*, escolha o tipo *Supabase Edge Function*, selecione `promo-watch` e use o horário `0 */2 * * *` (a cada 2 horas).
4. **No celular**: instale o app (no iPhone, *Adicionar à Tela de Início*), abra **Viagens** e toque em *Ativar avisos neste aparelho*.

Para testar sem esperar, abra `https://SEU-PROJETO.supabase.co/functions/v1/promo-watch` no navegador: a resposta mostra quantas promoções foram lidas e quantos avisos foram enviados (a função ignora chamadas repetidas em menos de 10 minutos).

## Login com Google e Microsoft

Ative cada provedor em *Authentication → Sign In / Providers* no Supabase (é preciso criar as credenciais no Google Cloud e no Microsoft Entra, usando a *Callback URL* mostrada pelo Supabase) e depois defina `VITE_OAUTH_PROVIDERS=google,azure` para exibir os botões.

## Publicação

Importe o repositório na Vercel (ela publica o branch `main` a cada merge), defina as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e mantenha o comando `npm run build` com saída em `dist`. O arquivo `vercel.json` já redireciona todas as rotas para `/index.html`. Depois do deploy, coloque o endereço gerado em *Authentication → URL Configuration* no Supabase.

## Como o milheiro é calculado

Custo médio ponderado, igual à planilha original: entradas somam pontos e custo; saídas retiram pontos e o custo proporcional (`pontos × milheiro acumulado ÷ 1000`). Em transferências, o destino herda o custo retirado da origem mais custos extras; o bônus entra sem custo. O custo herdado é gravado no momento da transferência.
