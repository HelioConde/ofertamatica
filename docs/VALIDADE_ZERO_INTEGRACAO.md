# Validade Zero no portal Ofertamática

## Integração inicial

Rota pública: `https://ofertamatica.com.br/validade-zero/`.

A página apresenta a ferramenta e liga ao aplicativo já existente em
`https://helioconde.github.io/validade_zero/`. O usuário pode começar
sem login no modo local e usar uma conta Supabase para salvar na nuvem.

Não duplicamos o código React do Validade Zero nem usamos iframe: a
aplicação precisa de suas próprias rotas, Service Worker, permissões
de câmera/notificações e armazenamento do navegador. Abrir em outra
origem também impede alegações falsas de sessão ou dados compartilhados.

## Limites

- É uma integração **por navegação**, não uma incorporação do app no domínio.
- O banco do Validade Zero e a conta do Ofertamática são independentes.
- Dados do modo local ficam na origem do aplicativo e não são migrados
  automaticamente para o Ofertamática.
- Não expor credenciais secretas, JWTs ou URL com tokens em links.
- O Validade Zero está em validação para uso operacional; a página não
  o apresenta como sistema de produção homologado.
- O fluxo principal de cartazes em `/` continua com seletor primeiro,
  sem landing obrigatória e sem novos blocos pesados.

## Checklist de publicação

1. Verificar que o GitHub Pages do Validade Zero está publicado, abrindo
   diretamente `https://helioconde.github.io/validade_zero/` em celular.
2. No Ofertamática, executar `npm run verify` e `npm run qa:design`.
3. Abrir `/validade-zero/` em desktop e celular: título, link externo,
   informação de privacidade e botão de retorno ao criador.
4. Verificar o HTML estático e o sitemap gerados para a rota, bem como
   o link descobrível a partir da home, sem causar páginas órfãs.
5. Testar no Validade Zero: modo local, login Supabase, cadastro de lote,
   câmera com permissão e confirmação manual do OCR.
6. Testar Push em aparelho real após permissão explícita; o sucesso do
   Cron sozinho não prova entrega de notificações.

## Futuro

Se o objetivo for publicar o aplicativo **dentro do mesmo domínio**
(`ofertamatica.com.br/validade-zero/` com a interface completa),
é necessária migração controlada de base path, redirect URLs de Auth,
Service Worker, publicação independente e preservação de dados locais.
Não fazer apenas um iframe ou cópia do `dist` sem essas verificações.
