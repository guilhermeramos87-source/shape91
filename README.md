# Shape 91 V10 CLEAN

Inclui tudo da V9 e adiciona dieta automática.

A dieta usa:
- sexo
- idade
- altura
- peso
- objetivo
- calorias
- proteína
- número de refeições
- horários cadastrados
- preferências
- restrições alimentares

Cada refeição mostra:
- horário
- calorias aproximadas
- proteína aproximada
- porções sugeridas
- substituições

Também mantém:
- rotina completa de horários
- treino Casa sem máquinas
- treino Academia
- foto por URL
- edição de perfil
- meta x realizado
- multiusuário

## Supabase
Execute `supabase_v10_migration.sql`.

## Atualização
Preserve `.env.local` e `.git`, substitua os demais arquivos pela V10.

## Teste
npm install
npm run dev

Confirme `V10 CLEAN`.

## Publicar
git add -A
git commit -m "Publica Shape 91 V10 com dieta automatica"
git push
