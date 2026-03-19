
import { removeBackground } from '@imgly/background-removal';
import { logger } from '../../lib/logger';

export const removeBackgroundFromImage = async (imageSource: string | File | Blob): Promise<Blob> => {
    try {
        // Configuração para baixar os assets do CDN público padrão (unpkg/jsdelivr)
        // Isso evita ter que copiar arquivos manualmente para public/
        const config = {
            progress: (key: string, current: number, total: number) => {
                // Opcional: callback de progresso
                // logger.debug(`Downloading ${key}: ${current}/${total}`);
            },
            debug: false
        };

        const blob = await removeBackground(imageSource, config);
        return blob;
    } catch (error) {
        logger.error('Erro na remoção de fundo com @imgly:', { error });
        throw new Error('Falha ao remover o fundo da imagem.');
    }
};
