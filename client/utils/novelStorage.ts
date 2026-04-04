import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteCharacter, getAllCharacters } from './characterStorage';

export interface NovelChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  isPrologue?: boolean; // 是否为楔子
  createdAt: number;
  updatedAt: number;
}

export interface Novel {
  id: string;
  title: string;
  theme: string;
  themeType: string; // 小说主题类型
  maleCharacterId?: string; // 男主ID
  femaleCharacterId?: string; // 女主ID
  chapters: NovelChapter[];
  content: string; // 当前续写内容
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'writing' | 'completed';
  isImported?: boolean; // 是否为导入小说
}

const NOVELS_KEY = '@novel_app_novels';

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 获取所有小说
export const getAllNovels = async (): Promise<Novel[]> => {
  try {
    const data = await AsyncStorage.getItem(NOVELS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting novels:', error);
    return [];
  }
};

// 获取正在写作的小说
export const getWritingNovels = async (): Promise<Novel[]> => {
  try {
    const novels = await getAllNovels();
    return novels.filter(n => n.status === 'writing');
  } catch (error) {
    console.error('Error getting writing novels:', error);
    return [];
  }
};

// 保存小说
export const saveNovel = async (novel: Novel): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const index = novels.findIndex(n => n.id === novel.id);
    if (index !== -1) {
      novels[index] = { ...novel, updatedAt: Date.now() };
    } else {
      novels.push(novel);
    }
    await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
  } catch (error) {
    console.error('Error saving novel:', error);
    throw error;
  }
};

// 创建新小说
export const createNovel = async (
  title: string,
  theme: string,
  themeType: string,
  maleCharacterId?: string,
  femaleCharacterId?: string,
  isImported?: boolean
): Promise<Novel> => {
  const novel: Novel = {
    id: generateId(),
    title,
    theme,
    themeType,
    maleCharacterId,
    femaleCharacterId,
    chapters: [],
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
    isImported: isImported || false,
  };
  await saveNovel(novel);
  return novel;
};

// 更新小说内容
export const updateNovelContent = async (novelId: string, content: string): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const index = novels.findIndex(n => n.id === novelId);
    if (index !== -1) {
      novels[index].content = content;
      novels[index].updatedAt = Date.now();
      novels[index].status = 'writing';
      await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
    }
  } catch (error) {
    console.error('Error updating novel content:', error);
    throw error;
  }
};

// 添加章节
export const addChapter = async (
  novelId: string, 
  title: string, 
  isPrologue: boolean = false,
  customOrder?: number // 可选的自定义序号（用于导入章节）
): Promise<NovelChapter> => {
  try {
    const novels = await getAllNovels();
    const index = novels.findIndex(n => n.id === novelId);
    if (index !== -1) {
      let order: number;
      
      // 如果传入了自定义序号，直接使用
      if (customOrder !== undefined) {
        order = customOrder;
      } else {
        // 否则自动计算章节顺序：楔子为0，正文章节从1开始
        if (isPrologue) {
          order = 0;
        } else {
          // 正文章节顺序 = 现有非楔子章节数 + 1
          const normalChapters = novels[index].chapters.filter(c => !c.isPrologue);
          order = normalChapters.length + 1;
        }
      }
      
      const chapter: NovelChapter = {
        id: generateId(),
        title,
        content: '',
        order,
        isPrologue,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      novels[index].chapters.push(chapter);
      // 按order排序
      novels[index].chapters.sort((a, b) => a.order - b.order);
      novels[index].updatedAt = Date.now();
      novels[index].status = 'writing'; // 添加章节时也更新状态为 writing
      await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
      return chapter;
    }
    throw new Error('Novel not found');
  } catch (error) {
    console.error('Error adding chapter:', error);
    throw error;
  }
};

// 更新章节
export const updateChapter = async (
  novelId: string,
  chapterId: string,
  updates: Partial<NovelChapter>
): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const novelIndex = novels.findIndex(n => n.id === novelId);
    if (novelIndex !== -1) {
      const chapterIndex = novels[novelIndex].chapters.findIndex(c => c.id === chapterId);
      if (chapterIndex !== -1) {
        novels[novelIndex].chapters[chapterIndex] = {
          ...novels[novelIndex].chapters[chapterIndex],
          ...updates,
          updatedAt: Date.now(),
        };
        novels[novelIndex].updatedAt = Date.now();
        novels[novelIndex].status = 'writing'; // 确保状态更新为 writing
        await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
      }
    }
  } catch (error) {
    console.error('Error updating chapter:', error);
    throw error;
  }
};

// 删除章节
export const deleteChapter = async (novelId: string, chapterId: string): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const novelIndex = novels.findIndex(n => n.id === novelId);
    if (novelIndex !== -1) {
      novels[novelIndex].chapters = novels[novelIndex].chapters.filter(c => c.id !== chapterId);
      // 重新排序
      novels[novelIndex].chapters.forEach((c, i) => {
        c.order = i + 1;
      });
      novels[novelIndex].updatedAt = Date.now();
      await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
    }
  } catch (error) {
    console.error('Error deleting chapter:', error);
    throw error;
  }
};

// 删除小说
export const deleteNovel = async (novelId: string): Promise<void> => {
  try {
    // 获取小说信息以获取关联的角色ID
    const novels = await getAllNovels();
    const novel = novels.find(n => n.id === novelId);
    
    // 删除小说
    const filtered = novels.filter(n => n.id !== novelId);
    await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(filtered));
    
    // 删除锁定的角色（novelId字段等于该小说ID的角色）
    if (novel) {
      const characters = await getAllCharacters();
      const lockedCharacters = characters.filter(c => c.novelId === novelId);
      
      for (const character of lockedCharacters) {
        await deleteCharacter(character.id);
      }
    }
  } catch (error) {
    console.error('Error deleting novel:', error);
    throw error;
  }
};

// 获取小说详情
export const getNovelById = async (novelId: string): Promise<Novel | null> => {
  try {
    const novels = await getAllNovels();
    return novels.find(n => n.id === novelId) || null;
  } catch (error) {
    console.error('Error getting novel:', error);
    return null;
  }
};
