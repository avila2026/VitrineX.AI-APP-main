/**
 * PROTOCOLO ANTIGRAVIT: MEMÓRIA ATIVA
 * Serviço responsável por registrar interações no banco de dados remoto.
 */
import { supabase } from '../lib/supabase'; // Importação necessária para o contexto de autheticação
import { translateText } from './ai/text';
import { logger } from '../lib/logger';

// === MÓDULO DE MEMÓRIA HÍBRIDA (Supabase + MySQL) ===

export const Antigravit_Memorizar = async (promptUsuario: string, respostaIA: string, textoEditado: string | null = null) => {
    logger.info("⚡ Iniciando gravação de memória...");

    // 1. Tenta pegar o ID do usuário logado no Supabase
    let usuarioID = 'visitante_anonimo';

    try {
        if (typeof supabase !== 'undefined') {
            const { data } = await supabase.auth.getUser();
            if (data && data.user) {
                usuarioID = data.user.id; // Ex: "a12b3c..."
                logger.debug("👤 Usuário identificado:", { email: data.user.email });
            }
        }
    } catch (e: any) {
        logger.warn("⚠️ Supabase não detectado ou usuário deslogado.", { error: e.message || e });
    }

    // 2. Traduz os textos para o inglês
    const [prompt_en, resposta_en, versao_final_en] = await Promise.all([
        translateText(promptUsuario, 'en-US', 'pt-BR'),
        translateText(respostaIA, 'en-US', 'pt-BR'),
        textoEditado ? translateText(textoEditado, 'en-US', 'pt-BR') : null
    ]);

    // 3. Prepara o pacote para a Hostinger
    const pacoteDeDados = {
        session_id: usuarioID,      // O ID do Supabase vai aqui!
        tipo_acao: 'geracao_ia',
        prompt: promptUsuario,
        resposta: respostaIA,
        versao_final: textoEditado,
        prompt_en: prompt_en,
        resposta_en: resposta_en,
        versao_final_en: versao_final_en
    };

    // 4. Envia para o seu servidor MySQL
    try {
        // Ajuste a URL se necessário
        const urlAPI = 'https://vitrinex.site/api/registrar_treino.php';

        const response = await fetch(urlAPI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pacoteDeDados)
        });

        // Tentar parsear JSON, com proteção
        try {
            const resultado = await response.json();
            if (resultado.status === 'sucesso') {
                logger.info("✅ Memória consolidada no Servidor.");
            } else {
                logger.warn("⚠️ Erro no servidor de memória:", { msg: resultado.msg });
            }
        } catch (jsonErr) {
            const text = await response.text();
            logger.warn("⚠️ Resposta não-JSON do servidor de memória:", { text });
        }

    } catch (erro: any) {
        logger.error("❌ Falha na conexão com Hostinger (Antigravit):", { error: erro.message || erro });
    }
}
