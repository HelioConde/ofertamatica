# Minhas listas — reutilização de ofertas sem banco

O editor agora oferece o menu **+ → Minhas listas** na entrada rápida para listas que se repetem toda semana.

## Como usar
1. Cole ou importe produtos como já faz hoje.
2. Abra **+ → Minhas listas**, dê um nome (por exemplo, “Ofertas da semana”) e clique em Salvar lista atual.
3. Ao voltar, escolha **Usar**; se houver outra lista na caixa de entrada, o editor pede confirmação antes de substituí-la.
4. Para levar a lista a outro computador ou guardar uma cópia, use **Baixar TXT**. O arquivo pode ser importado novamente em **+ → Importar arquivo**.
5. Excluir uma lista precisa de confirmação.

## Privacidade e limites
- Cada dispositivo/navegador guarda até 12 listas nomeadas em `localStorage`, com até 15.000 caracteres por lista.
- Os dados são apenas o **texto bruto** que aparece na caixa de entrada. A biblioteca não salva fotos, cabeçalhos, modelos, alterações feitas após gerar a lista nem o estado de impressão: para esse trabalho, use o rascunho automático.
- Nenhum dado é enviado a um servidor por essa funcionalidade.
- Esvaziar os dados do navegador ou usar outro computador pode apagar as listas. Recomenda-se baixar TXT das listas importantes.
- A biblioteca não altera as listas recentes (até cinco), nem o rascunho automático, nem o mecanismo do gerador.
- Caso o armazenamento esteja desativado ou sem espaço, a interface explica o erro em vez de afirmar que salvou.

## Qualidade
Testes em `npm run verify` e `node scripts/qa-interactions.mjs` cobrem salvar, atualizar pelo mesmo nome, limite de listas, privacidade, download TXT, recuperação após reload, confirmação de troca, exclusão e mobile/desktop.
