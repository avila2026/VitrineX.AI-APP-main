import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { CreateContentInput, UpdateContentInput, StrongContent } from '../types/content.types';
import { logger } from '../lib/logger';

export const useContentSave = () => {
    const { addToast } = useToast();

    const saveContent = async (content: any, tableName: string = 'contents') => {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert(content)
                .select()
                .single();

            if (error) {
                addToast({
                    type: 'error',
                    message: `Erro ao salvar em ${tableName}: ${error.message}`
                });
                throw error;
            }

            addToast({
                type: 'success',
                message: 'Conteúdo salvo com sucesso!'
            });

            return data;
        } catch (error) {
            logger.error(`Error saving content to ${tableName}:`, { error });
            throw error;
        }
    };

    const updateContent = async (id: string, updates: any, tableName: string = 'contents') => {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                addToast({
                    type: 'error',
                    message: `Erro ao atualizar em ${tableName}: ${error.message}`
                });
                throw error;
            }

            addToast({
                type: 'success',
                message: 'Conteúdo atualizado!'
            });

            return data;
        } catch (error) {
            logger.error(`Error updating content in ${tableName}:`, { error });
            throw error;
        }
    };

    const deleteContent = async (id: string, tableName: string = 'contents') => {
        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) {
                addToast({
                    type: 'error',
                    message: `Erro ao deletar de ${tableName}: ${error.message}`
                });
                throw error;
            }

            addToast({
                type: 'success',
                message: 'Conteúdo deletado!'
            });
        } catch (error) {
            logger.error(`Error deleting content from ${tableName}:`, { error });
            throw error;
        }
    };

    return {
        saveContent,
        updateContent,
        deleteContent
    };
};
