# Revisão AdSense da Ofertamática — inventário e conteúdo (28/10/2026)

**Status conhecido:** o Google AdSense informou que o site não está pronto para receber anúncios devido a **“Conteúdo de baixo valor”**. O texto geral “Notificação sobre políticas solicitando mudanças no seu site” não é, por si só, uma nova infração nem identifica uma URL.

## O que dizem as regras relevantes

- **Conteúdo exclusivo e de valor:** o Google recomenda páginas com conteúdo original suficiente, conteúdo atualizado e uma experiência que ajude o visitante. Páginas muito parecidas precisam ser diferenciadas ou consolidadas.
- **Valor do inventário:** evitar anúncios em páginas usadas principalmente para navegação, avisos, placeholders ou sem conteúdo próprio suficiente.
- **Interferência:** não colocar anúncios junto a botões essenciais de navegação/ações nem sobre o editor ou o material impresso.
- **Privacidade:** informar a coleta e preservar consentimento. Não transmitir textos de listas, nomes de clientes ou outros dados pessoais ao Google sem necessidade.
- **Direitos autorais:** só usar fotos de produtos, artes, fontes e logotipos com direito de uso adequado; imagens de terceiros não viram conteúdo original só por aparecerem em um modelo.
- **Políticas vs restrições:** violação de política pode bloquear monetização; uma *restrição* de conteúdo reduz a demanda de anunciantes e não é automaticamente uma infração.

## Mitigação implementada

- O atributo **`VITE_ADSENSE_APPROVED`** precisa ser literalmente `true` para que um bloco de anúncio gerenciado pelo React possa ser criado. O valor padrão é desativado.
- Nenhum bloco publicitário no seletor inicial de formatos. Nenhuma posição em páginas institucionais, catálogo de modelos e páginas cuja finalidade principal é navegação.
- Posições futuras nos guias só são candidatas quando existem **pelo menos 2 seções explicativas, 3 dicas e 2 aplicações práticas**. Esse critério de engenharia **não é um critério oficial de elegibilidade nem uma garantia de qualidade**.
- **Preservados:** publisher `ca-pub-9514218545388169`, arquivo ads.txt, bootstrap de consentimento, CMS/Google CMP e o gerador de cartazes. O script publisher do Google continua presente para o processo de verificação; eventualmente, as configurações de **Anúncios automáticos** devem ser conferidas no próprio AdSense, pois são controladas externamente.
- Teste `scripts/validate-adsense-placement.mjs` passa a rodar em `npm run verify`.

## Revisão editorial manual ainda necessária (antes de reenviar)

1. Conferir cada guia público, modelos e páginas de serviço em **desktop e celular**, com e sem JS. Se uma página só tiver título, propaganda de outro caminho ou texto duplicado, melhorar com instrução original real ou consolidá-la, sem redirecionar tudo para a home.
2. Revisar resultados de `npm run audit:content` com julgamento editorial; contagem de palavras não prova utilidade. Dar prioridade às páginas que recebem impressões no Search Console e aos guias com calculadoras e demonstrações do editor.
3. Verificar se imagens de marcas/produtos e backgrounds possuem autorização, licença adequada ou uso permitido. Não fazer afirmações de parceria com marcas só porque produtos aparecem nos exemplos.
4. Verificar a ferramenta real: criação, importação, conferência de preços, exportação PDF e impressão física. Usar valores demonstrativos claramente rotulados; confirmar unidade de venda e condições comerciais.
5. Validar **Search Console (indexação/404/canonical)**, **GA4 (Tempo real, somente com consentimento)** e acesso HTTP dos rastreadores. O desafio WAF na Locaweb ainda é um diagnóstico separado e deve ser revisado pela hospedagem.
6. Conferir no AdSense **Sites** e, se disponível, na **Central de políticas → Corrigir** se há exemplos de URL ou informações adicionais específicas. Não supor outras violações sem evidências.
7. **Só pedir revisão** depois que o conteúdo, acesso e as políticas estiverem verificados. Em caso de aprovação, revisar posições e consentimento novamente, e **só então** configurar `VITE_ADSENSE_APPROVED=true` na compilação. Não automatizar ativação por receber e-mail ou alterar dados de produção sem auditoria.

## Referências oficiais
- [Conteúdo e experiência do usuário](https://support.google.com/adsense/answer/10015918?hl=pt-BR)
- [Notificações de política e revisão](https://support.google.com/adsense/answer/1378153?hl=pt-BR)
- [Políticas para publishers](https://support.google.com/adsense/answer/10502938?hl=pt-BR)
- [Restrições para publishers](https://support.google.com/adsense/answer/10437795?hl=pt-BR)

Este registro é preventivo: não representa parecer oficial do Google nem aprovação do inventário.
