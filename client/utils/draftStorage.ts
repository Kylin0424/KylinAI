import AsyncStorage from '@react-native-async-storage/async-storage';
import { Novel, NovelChapter } from './novelStorage';

const DRAFTS_KEY = 'novel_drafts';

// 草稿箱小说类型
export interface DraftNovel extends Novel {
  deletedAt: string; // 删除时间
  themeName?: string; // 主题名称
}

// 获取所有草稿
export const getAllDrafts = async (): Promise<DraftNovel[]> => {
  try {
    const data = await AsyncStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting drafts:', error);
    return [];
  }
};

// 添加到草稿箱
export const addToDraft = async (novel: Novel): Promise<void> => {
  try {
    const drafts = await getAllDrafts();
    const draftNovel: DraftNovel = {
      ...novel,
      deletedAt: new Date().toISOString(),
    };
    drafts.unshift(draftNovel);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Error adding to draft:', error);
    throw error;
  }
};

// 从草稿箱恢复
export const restoreFromDraft = async (draftId: string): Promise<DraftNovel | null> => {
  try {
    const drafts = await getAllDrafts();
    const draftIndex = drafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) return null;
    
    const draft = drafts[draftIndex];
    const newDrafts = drafts.filter(d => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(newDrafts));
    
    // 返回恢复的小说（去掉deletedAt字段）
    const { deletedAt, ...novel } = draft;
    return draft;
  } catch (error) {
    console.error('Error restoring from draft:', error);
    return null;
  }
};

// 从草稿箱彻底删除
export const deleteFromDraft = async (draftId: string): Promise<void> => {
  try {
    const drafts = await getAllDrafts();
    const newDrafts = drafts.filter(d => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(newDrafts));
  } catch (error) {
    console.error('Error deleting from draft:', error);
    throw error;
  }
};

// 清空草稿箱
export const clearAllDrafts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRAFTS_KEY);
  } catch (error) {
    console.error('Error clearing drafts:', error);
    throw error;
  }
};
