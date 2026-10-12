# Shape 91 — V2

Versão com login, Supabase e histórico sincronizado.

## 1. Criar projeto no Supabase
Acesse https://supabase.com e crie um projeto.

## 2. Criar a tabela
No painel do Supabase:
SQL Editor -> New query -> cole todo o conteúdo de `supabase_schema.sql` -> Run.

## 3. Pegar URL e Publishable Key
No projeto do Supabase abra o painel Connect e copie:
- Project URL
- Publishable Key

## 4. Criar `.env.local`
Na raiz do projeto copie `.env.example` para `.env.local` e preencha:

VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

## 5. Instalar e rodar
No Prompt de Comando dentro da pasta:

npm install
npm run dev

## 6. Criar sua conta
Abra o endereço local do Vite, clique em Criar conta e cadastre seu e-mail/senha.
Se o Supabase exigir confirmação de e-mail, confirme antes de entrar.

## 7. Publicar
Suba o projeto para um repositório GitHub e importe na Vercel.
No projeto da Vercel, adicione as duas variáveis:
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY

Depois faça o deploy.

## Segurança
O arquivo `.env.local` está ignorado no Git. Não publique sua chave secreta/service_role.
A Publishable Key é a chave destinada ao cliente web; o acesso aos dados é protegido por RLS.
