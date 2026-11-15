# MinhasMilhas

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

## Login com Google e Microsoft

Ative cada provedor em *Authentication → Sign In / Providers* no Supabase (é preciso criar as credenciais no Google Cloud e no Microsoft Entra, usando a *Callback URL* mostrada pelo Supabase) e depois defina `VITE_OAUTH_PROVIDERS=google,azure` para exibir os botões.

## Publicação

Importe o repositório na Vercel ou Netlify, defina as variáveis `VITE_*` e use `npm run build` (saída em `dist`). Em Vercel, adicione uma regra de reescrita de todas as rotas para `/index.html`.

## Como o milheiro é calculado

Custo médio ponderado, igual à planilha original: entradas somam pontos e custo; saídas retiram pontos e o custo proporcional (`pontos × milheiro acumulado ÷ 1000`). Em transferências, o destino herda o custo retirado da origem mais custos extras; o bônus entra sem custo. O custo herdado é gravado no momento da transferência.
