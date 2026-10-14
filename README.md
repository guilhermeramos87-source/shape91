# Shape 91 V11.1 CLEAN

Mantém tudo da V10.1 e adiciona:

- Foto de perfil por câmera ou galeria
- Fotos de evolução: frente, lado e costas
- Fotos de evolução privadas por usuário
- Equipamentos disponíveis em casa
- Treino caseiro realmente adaptado aos equipamentos
- Orientação de progressão de carga/repetições
- Dieta automática
- Rotina completa com horários
- Metas automáticas/manuais
- Meta x realizado
- Multiusuário

## 1. Supabase
Execute `supabase_v11_migration.sql` no SQL Editor.

Ele cria:
- campos de equipamentos e foto
- tabela `progress_photos`
- bucket público `profile-photos`
- bucket privado `progress-photos`
- políticas de acesso por usuário

## 2. Atualização
Preserve `.env.local` e `.git`.
Substitua os demais arquivos pela V11.

## 3. Teste
npm install
npm run dev

Confirme `V11.1 CLEAN`.

## 4. Publicar
git add -A
git commit -m "Publica Shape 91 V11 fotos e treino casa"
git push

## Correção V11.1
Corrige imports de câmera/galeria e `useRef`, que causavam tela em branco no navegador.
