# Consentimento Ofertamática

O arquivo public/consent-bootstrap.js define Consent Mode v2 negado por padrão, antes de qualquer tag, e mantém os dados opcionais bloqueados até confirmação da CMP Google Privacy & Messaging.

Fora de GDPR, o visitante pode rejeitar, aceitar ou configurar estatísticas, anúncios e personalização. A opção fica por 180 dias em localStorage. Revogação impede futuras solicitações opcionais e reinicia a página quando necessário.

Quando a CMP certificada Google indica GDPR aplicável, ela controla as opções e a revogação via googlefc, IAB TCF e Consent Mode. Não geramos TC strings. Sem retorno verificável da CMP, a integração bloqueia serviços opcionais.

Verificações manuais obrigatórias no painel: (1) publicar mensagem regulamentações europeias com recusa e gerenciamento; (2) habilitar Consent Mode na área Privacidade e mensagens; (3) configurar consent checks nas tags personalizadas do GTM; (4) testar em navegadores de regiões diferentes e usar Tag Assistant. Uma solução técnica não substitui auditoria jurídica.

Testes: node scripts/validate-consent.mjs. 
