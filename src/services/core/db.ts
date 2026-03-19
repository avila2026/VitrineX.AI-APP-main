import { UserProfile, Post, Ad, Campaign, Trend, LibraryItem, ScheduleEntry, TargetAudience } from '../../types';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

// Real Supabase Database Service
// Replaces the previous Mock Database Service.

// --- Helper for Errors ---
const handleError = (context: string, error: any) => {
    logger.error(`Error in ${context}:`, { error });
    throw new Error(error.message || `Falha em ${context}`);
};

// --- User Profile Operations ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // Check for Mock User
    if (userId === 'mock-user-123') {
        const localMock = localStorage.getItem('vitrinex_mock_profile');
        if (localMock) {
            return JSON.parse(localMock) as UserProfile;
        }
        return {
            id: 'mock-user-123',
            email: 'demo@vitrinex.ai',
            full_name: 'Usuário Demo',
            plan: 'premium',
            created_at: new Date().toISOString(),
            businessProfile: {
                name: 'Minha Loja Demo',
                industry: 'Varejo',
                targetAudience: 'Jovens adultos',
                visualStyle: 'Moderno'
            },
            credits: 1000
        } as UserProfile;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data as UserProfile;
    } catch (error) {
        logger.warn('getUserProfile failed (likely offline/no-config). Returning null.', { error });
        return null; // Fail gracefully
    }
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
    try {
        if (userId === 'mock-user-123') {
            // Persist mock updates to local storage so they survive refresh
            const current = await getUserProfile(userId);
            const updated = { ...current, ...profile };
            localStorage.setItem('vitrinex_mock_profile', JSON.stringify(updated));
            return;
        }

        const { error } = await supabase
            .from('users')
            .update(profile)
            .eq('id', userId);

        if (error) throw error;
    } catch (error) {
        logger.warn('updateUserProfile failed, persisting locally if possible', { error });
    }
};

// --- Content Operations ---

export const savePost = async (post: Post): Promise<Post> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .upsert(post)
            .select()
            .single();

        if (error) throw error;
        return data as Post;
    } catch (error) {
        logger.warn('Supabase savePost failed, fallback to local', { error });
        return saveLocalData('posts', post);
    }
};

export const getPosts = async (userId: string): Promise<Post[]> => {
    let supabaseItems: Post[] = [];
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (!error && data) supabaseItems = data as Post[];
    } catch (error) {
        logger.warn('getPosts failed', { error });
    }

    // Merge Local Only if needed or as primary if offline
    const localItems = getLocalData<Post>('posts').filter(i => i.userId === userId);

    // Merge logic: prefer supabase, append local if not present
    const allItems = [...supabaseItems];
    localItems.forEach(local => {
        if (!allItems.find(s => s.id === local.id)) {
            allItems.push(local);
        }
    });

    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const saveAd = async (ad: Ad): Promise<Ad> => {
    try {
        const { data, error } = await supabase
            .from('ads')
            .upsert(ad)
            .select()
            .single();

        if (error) throw error;
        return data as Ad;
    } catch (error) {
        logger.warn('saveAd failed, fallback to local', { error });
        return saveLocalData('ads', ad);
    }
};

export const getAds = async (userId: string): Promise<Ad[]> => {
    let supabaseItems: Ad[] = [];
    try {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (!error && data) supabaseItems = data as Ad[];
    } catch (error) {
        logger.warn('getAds failed', { error });
    }

    const localItems = getLocalData<Ad>('ads').filter(i => i.userId === userId);
    const allItems = [...supabaseItems];
    localItems.forEach(local => {
        if (!allItems.find(s => s.id === local.id)) allItems.push(local);
    });

    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const saveCampaign = async (campaign: Campaign): Promise<Campaign> => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .upsert(campaign)
            .select()
            .single();

        if (error) throw error;
        return data as Campaign;
    } catch (error) {
        logger.warn('saveCampaign failed, fallback to local', { error });
        return saveLocalData('campaigns', campaign);
    }
};

export const getCampaigns = async (userId: string): Promise<Campaign[]> => {
    let supabaseItems: Campaign[] = [];
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (!error && data) supabaseItems = data as Campaign[];
    } catch (error) {
        logger.warn('getCampaigns failed', { error });
    }

    const localItems = getLocalData<Campaign>('campaigns').filter(i => i.userId === userId);
    const allItems = [...supabaseItems];
    localItems.forEach(local => {
        if (!allItems.find(s => s.id === local.id)) allItems.push(local);
    });

    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const saveTrend = async (trend: Trend): Promise<Trend> => {
    try {
        const { data, error } = await supabase
            .from('trends')
            .upsert(trend)
            .select()
            .single();
        if (error) throw error;
        return data as Trend;
    } catch (e) {
        logger.warn('saveTrend failed, fallback to local', { error: e });
        return saveLocalData('trends', trend);
    }

};

export const getTrends = async (userId: string): Promise<Trend[]> => {
    let supabaseItems: Trend[] = [];
    try {
        const { data, error } = await supabase
            .from('trends')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false });

        if (!error && data) supabaseItems = data as Trend[];
    } catch (error) {
        logger.warn('getTrends failed', { error });
    }

    const localItems = getLocalData<Trend>('trends').filter(i => i.userId === userId);
    const allItems = [...supabaseItems];
    localItems.forEach(local => {
        if (!allItems.find(s => s.id === local.id)) allItems.push(local);
    });

    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// --- Target Audience Operations ---

export const getTargetAudiences = async (userId: string): Promise<TargetAudience[]> => {
    const { data, error } = await supabase
        .from('target_audiences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) handleError('getTargetAudiences', error);
    return (data as TargetAudience[]) || [];
};

export const createTargetAudience = async (audience: Omit<TargetAudience, 'id' | 'created_at'>): Promise<TargetAudience> => {
    const { data, error } = await supabase
        .from('target_audiences')
        .insert([audience])
        .select()
        .single();

    if (error) handleError('createTargetAudience', error);
    return data as TargetAudience;
};

export const updateTargetAudience = async (audienceId: string, updates: Partial<TargetAudience>): Promise<TargetAudience> => {
    const { data, error } = await supabase
        .from('target_audiences')
        .update(updates)
        .eq('id', audienceId)
        .select()
        .single();

    if (error) handleError('updateTargetAudience', error);
    return data as TargetAudience;
};

export const deleteTargetAudience = async (audienceId: string): Promise<void> => {
    const { error } = await supabase
        .from('target_audiences')
        .delete()
        .eq('id', audienceId);

    if (error) handleError('deleteTargetAudience', error);
};

// --- Local Storage Helpers ---
const getLocalData = <T>(key: string): T[] => {
    try {
        const item = localStorage.getItem(`vitrinex_${key}`);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        logger.warn(`Failed to parse local data for ${key}`, { error: e });
        return [];
    }
};

const saveLocalData = <T extends { id: string }>(key: string, data: T): T => {
    try {
        const current = getLocalData<T>(key);
        const index = current.findIndex(i => i.id === data.id);
        if (index >= 0) {
            current[index] = data;
        } else {
            current.unshift(data); // Add to top
        }
        localStorage.setItem(`vitrinex_${key}`, JSON.stringify(current));
        return data;
    } catch (e) {
        logger.error(`Failed to save local data for ${key}`, { error: e });
        throw e;
    }
};

// --- Library Operations ---

export const saveLibraryItem = async (item: LibraryItem): Promise<LibraryItem> => {
    try {
        // Try Supabase first
        const { data, error } = await supabase
            .from('library_items')
            .upsert(item)
            .select()
            .single();

        if (error) throw error;
        return data as LibraryItem;
    } catch (error) {
        logger.warn('Supabase save failed, falling back to LocalStorage:', { error });
        // Fallback to LocalStorage
        return saveLocalData('library_items', item);
    }
};

export const getLibraryItems = async (userId: string, tags?: string[]): Promise<LibraryItem[]> => {
    let supabaseItems: LibraryItem[] = [];
    let localItems: LibraryItem[] = [];

    // Try fetch from Supabase
    try {
        let query = supabase
            .from('library_items')
            .select('*')
            .order('createdAt', { ascending: false });

        // Note: We might want to filter by userId in a real app, 
        // but for local-first/fallback mixed mode, we might be lenient or filter in memory.
        if (userId) {
            query = query.eq('userId', userId);
        }

        if (tags && tags.length > 0) {
            query = query.contains('tags', tags);
        }

        const { data, error } = await query;
        if (!error && data) {
            supabaseItems = data as LibraryItem[];
        }
    } catch (e) {
        logger.warn('Supabase fetch failed:', { error: e });
    }

    // Fetch from LocalStorage
    try {
        localItems = getLocalData<LibraryItem>('library_items');
        if (userId) {
            localItems = localItems.filter(i => i.userId === userId);
        }
        if (tags && tags.length > 0) {
            localItems = localItems.filter(i => tags.some(t => i.tags.includes(t)));
        }
    } catch (e) {
        logger.warn('Local fetch failed:', { error: e });
    }

    // Merge logic: Local items take precedence if IDs conflict (optimistic updates), 
    // or we just concat. For simplicity, we filter duplicates by ID.
    const allItems = [...supabaseItems];
    localItems.forEach(local => {
        if (!allItems.find(supa => supa.id === local.id)) {
            allItems.push(local);
        }
    });

    // Sort by date desc
    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteLibraryItem = async (itemId: string): Promise<void> => {
    // Try delete from both
    try {
        await supabase.from('library_items').delete().eq('id', itemId);
    } catch (e) {
        logger.warn('Supabase delete failed for library item. It might have been already deleted or network failed.', { error: e });
    }

    try {
        const current = getLocalData<LibraryItem>('library_items');
        const filtered = current.filter(i => i.id !== itemId);
        localStorage.setItem('vitrinex_library_items', JSON.stringify(filtered));
    } catch (e) {
        logger.error('Local delete failed', { error: e });
    }
};

export const deleteAllLibraryItems = async (userId: string, type?: string, tag?: string): Promise<void> => {
    // 1. Delete from Supabase
    try {
        let query = supabase.from('library_items').delete().eq('userId', userId);

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        if (tag) {
            query = query.contains('tags', [tag]);
        }

        const { error } = await query;
        if (error) throw error;
    } catch (e) {
        logger.warn('Supabase bulk delete failed', { error: e });
    }

    // 2. Delete from LocalStorage
    try {
        const current = getLocalData<LibraryItem>('library_items');
        const filtered = current.filter(item => {
            if (item.userId !== userId) return true; // Keep other users' items

            // Check type match
            if (type && type !== 'all' && item.type !== type) return true;

            // Check tag match
            if (tag && !item.tags?.includes(tag)) return true;

            // If we are here, it means it Matches criteria => Delete (return false)
            return false;
        });
        localStorage.setItem('vitrinex_library_items', JSON.stringify(filtered));
    } catch (e) {
        logger.error('Local bulk delete failed', { error: e });
    }
};

// --- Schedule Operations ---

export const saveScheduleEntry = async (entry: ScheduleEntry): Promise<ScheduleEntry> => {
    try {
        const { data, error } = await supabase
            .from('schedule')
            .upsert(entry)
            .select()
            .single();

        if (error) throw error;
        return data as ScheduleEntry;
    } catch (e) {
        return saveLocalData('schedule', entry);
    }
};

export const getScheduleEntries = async (userId: string): Promise<ScheduleEntry[]> => {
    // Similar merge strategy or just local fallback
    try {
        const { data, error } = await supabase
            .from('schedule')
            .select('*')
            .eq('userId', userId)
            .order('datetime', { ascending: true });

        if (error) throw error;
        return data as ScheduleEntry[];
    } catch (e) {
        // Fallback
        const local = getLocalData<ScheduleEntry>('schedule');
        return local
            .filter(i => i.userId === userId)
            .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }
};

export const deleteScheduleEntry = async (entryId: string): Promise<void> => {
    try {
        await supabase.from('schedule').delete().eq('id', entryId);
    } catch (e) {
        logger.warn('Supabase delete failed for schedule entry. It might have been already deleted or network failed.', { error: e });
    }

    try {
        const current = getLocalData<ScheduleEntry>('schedule');
        const filtered = current.filter(i => i.id !== entryId);
        localStorage.setItem('vitrinex_schedule', JSON.stringify(filtered));
    } catch (e) {
        logger.error('Local delete failed for schedule entry', { error: e });
    }
};
