import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteCharacters, getAllCharacters, Character } from './characterStorage';

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
  name?: string; // 别名，与 title 相同
  theme: string;
  themeType: string; // 小说主题类型
  maleCharacterId?: string; // 男主ID
  femaleCharacterId?: string; // 女主ID
  sideCharacterIds: string[]; // 配角ID列表
  chapters: NovelChapter[];
  content: string; // 当前续写内容
  worldSettings?: string; // 世界设定（背景设定）
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'writing' | 'completed';
  isImported?: boolean; // 是否为导入小说
  // 世界设定信息
  worldName?: string; // 世界名称
  eraBackground?: string; // 年代背景
  seasonSetting?: string; // 季节设定
  protagonistDoing?: string; // 主角当前活动
  region?: string; // 地区
  cityLocation?: string; // 城市位置
  plotSummary?: string; // 剧情概要
  // 小说专属数据
  backgroundSettings?: string; // 背景设定
  worldView?: string; // 世界观
  currentScene?: string; // 当前场景状态
  recentPlotPoints?: string[]; // 近期剧情要点（用于AI参考）
  // 小说专属角色数据（从角色库转移过来）
  maleCharacterData?: Character; // 男主完整数据
  femaleCharacterData?: Character; // 女主完整数据
  sideCharacters?: Character[]; // 配角完整数据列表
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
  sideCharacterIds: string[] = [],
  isImported?: boolean,
  worldSettings?: {
    worldName?: string;
    eraBackground?: string;
    seasonSetting?: string;
    protagonistDoing?: string;
    region?: string;
    cityLocation?: string;
  }
): Promise<Novel> => {
  // 如果有主角/女主/配角ID，转移到小说专属数据
  const sideCharactersData: Character[] = [];
  if (sideCharacterIds.length > 0) {
    const allCharacters = await getAllCharacters();
    for (const charId of sideCharacterIds) {
      const char = allCharacters.find(c => c.id === charId);
      if (char) {
        // 复制到小说专属数据，保留原有数据
        sideCharactersData.push({
          ...char,
          shortTermMemory: char.shortTermMemory || [],
          longTermMemory: char.longTermMemory || [],
        });
      }
    }
    // 从闲置角色库删除已绑定的角色
    await deleteCharacters(sideCharacterIds);
  }

  // 获取主角和女主数据
  let maleCharacterData: Character | undefined;
  let femaleCharacterData: Character | undefined;
  if (maleCharacterId || femaleCharacterId) {
    const allCharacters = await getAllCharacters();
    if (maleCharacterId) {
      const char = allCharacters.find(c => c.id === maleCharacterId);
      if (char) {
        maleCharacterData = char;
        // 从闲置角色库删除主角
        await deleteCharacters([maleCharacterId]);
      }
    }
    if (femaleCharacterId) {
      const char = allCharacters.find(c => c.id === femaleCharacterId);
      if (char) {
        femaleCharacterData = char;
        // 从闲置角色库删除女主
        await deleteCharacters([femaleCharacterId]);
      }
    }
  }

  const novel: Novel = {
    id: generateId(),
    title,
    theme,
    themeType,
    maleCharacterId,
    femaleCharacterId,
    sideCharacterIds,
    maleCharacterData,
    femaleCharacterData,
    sideCharacters: sideCharactersData,
    chapters: [],
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
    isImported: isImported || false,
    // 世界设定信息
    worldName: worldSettings?.worldName,
    eraBackground: worldSettings?.eraBackground,
    seasonSetting: worldSettings?.seasonSetting,
    protagonistDoing: worldSettings?.protagonistDoing,
    region: worldSettings?.region,
    cityLocation: worldSettings?.cityLocation,
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

// 更新小说世界设定
export const updateNovelWorldSettings = async (
  novelId: string,
  worldSettings: {
    worldName?: string;
    eraBackground?: string;
    seasonSetting?: string;
    protagonistDoing?: string;
    region?: string;
    cityLocation?: string;
  }
): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const index = novels.findIndex(n => n.id === novelId);
    if (index !== -1) {
      if (worldSettings.worldName !== undefined) novels[index].worldName = worldSettings.worldName;
      if (worldSettings.eraBackground !== undefined) novels[index].eraBackground = worldSettings.eraBackground;
      if (worldSettings.seasonSetting !== undefined) novels[index].seasonSetting = worldSettings.seasonSetting;
      if (worldSettings.protagonistDoing !== undefined) novels[index].protagonistDoing = worldSettings.protagonistDoing;
      if (worldSettings.region !== undefined) novels[index].region = worldSettings.region;
      if (worldSettings.cityLocation !== undefined) novels[index].cityLocation = worldSettings.cityLocation;
      novels[index].updatedAt = Date.now();
      await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
    }
  } catch (error) {
    console.error('Error updating world settings:', error);
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
      const idsToDelete = lockedCharacters.map(c => c.id);
      
      if (idsToDelete.length > 0) {
        await deleteCharacters(idsToDelete);
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

// 记录角色经历
export const recordCharacterExperience = async (
  novelId: string,
  newExperiences: string[],
  currentContent: string
): Promise<void> => {
  try {
    const novel = await getNovelById(novelId);
    if (!novel) return;

    const characters = await getAllCharacters();
    const novelCharacters = characters.filter(c => c.novelId === novelId);
    const leadCharacters = novelCharacters.filter(
      c => c.id === novel.maleCharacterId || c.id === novel.femaleCharacterId
    );

    const SHORT_TERM_THRESHOLD = 10; // 短期经历累积阈值

    let updated = false;

    for (const char of leadCharacters) {
      const shortTerm = char.shortTermMemory || [];
      const longTerm = char.longTermMemory || [];
      
      // 追加新经历
      const newShortTerm = [...shortTerm, ...newExperiences];
      
      // 如果短期经历达到阈值，触发整合
      if (newShortTerm.length >= SHORT_TERM_THRESHOLD) {
        // 使用AI整合经历
        const summary = await summarizeExperiences(
          char.name,
          newShortTerm,
          currentContent
        );
        
        // 将摘要追加到长期记忆
        if (summary) {
          await updateCharacterMemory(
            novelId,
            char.id,
            [...longTerm, summary],
            []
          );
        } else {
          await updateCharacterMemory(novelId, char.id, longTerm, newShortTerm);
        }
      } else {
        await updateCharacterMemory(novelId, char.id, longTerm, newShortTerm);
      }
      updated = true;
    }

    if (updated) {
      // 更新小说的updatedAt
      novel.updatedAt = Date.now();
      await saveNovel(novel);
    }
  } catch (error) {
    console.error('Error recording character experience:', error);
  }
};

// AI整合经历摘要
const summarizeExperiences = async (
  characterName: string,
  experiences: string[],
  currentContent: string
): Promise<string | null> => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/summarize-experiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterName,
        experiences,
        currentContent
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.summary;
    }
    return null;
  } catch (error) {
    console.error('Error summarizing experiences:', error);
    return null;
  }
};

// 更新角色记忆（存储在Novel对象中）
export const updateCharacterMemory = async (
  novelId: string,
  characterId: string,
  longTermMemory: string[],
  shortTermMemory: string[]
): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const novelIndex = novels.findIndex(n => n.id === novelId);
    if (novelIndex === -1) return;

    const novel = novels[novelIndex];

    // 更新男主数据
    if (novel.maleCharacterData && novel.maleCharacterData.id === characterId) {
      novels[novelIndex].maleCharacterData = {
        ...novel.maleCharacterData,
        longTermMemory,
        shortTermMemory,
      };
    }
    // 更新女主数据
    else if (novel.femaleCharacterData && novel.femaleCharacterData.id === characterId) {
      novels[novelIndex].femaleCharacterData = {
        ...novel.femaleCharacterData,
        longTermMemory,
        shortTermMemory,
      };
    }
    // 更新配角数据
    else if (novel.sideCharacters) {
      const sideCharIndex = novel.sideCharacters.findIndex(c => c.id === characterId);
      if (sideCharIndex !== -1 && novel.sideCharacters[sideCharIndex]) {
        const updatedNovel = { ...novel };
        updatedNovel.sideCharacters = [...(updatedNovel.sideCharacters || [])];
        updatedNovel.sideCharacters[sideCharIndex] = {
          ...updatedNovel.sideCharacters[sideCharIndex],
          longTermMemory,
          shortTermMemory,
        };
        await saveNovel(updatedNovel);
        return;
      }
    }

    await saveNovel(novel);
  } catch (error) {
    console.error('Error updating character memory:', error);
  }
};

// 更新小说专属的角色数据（不操作全局角色库）
export const updateNovelCharacter = async (
  novelId: string,
  character: Character
): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const novelIndex = novels.findIndex(n => n.id === novelId);
    if (novelIndex === -1) return;

    const novel = novels[novelIndex];

    // 更新男主数据
    if (novel.maleCharacterData && novel.maleCharacterData.id === character.id) {
      novels[novelIndex].maleCharacterData = character;
    }
    // 更新女主数据
    else if (novel.femaleCharacterData && novel.femaleCharacterData.id === character.id) {
      novels[novelIndex].femaleCharacterData = character;
    }
    // 更新配角数据
    else if (novel.sideCharacters) {
      const sideIndex = novel.sideCharacters.findIndex(c => c.id === character.id);
      if (sideIndex !== -1) {
        novels[novelIndex].sideCharacters![sideIndex] = character;
      }
    }

    novels[novelIndex].updatedAt = Date.now();
    await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
  } catch (error) {
    console.error('Error updating novel character:', error);
  }
};

// 添加配角到小说
export const addSideCharacterToNovel = async (
  novelId: string,
  character: Character
): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const novelIndex = novels.findIndex(n => n.id === novelId);
    if (novelIndex === -1) return;

    // 初始化 sideCharacters 数组
    if (!novels[novelIndex].sideCharacters) {
      novels[novelIndex].sideCharacters = [];
    }

    // 检查是否已存在
    const exists = novels[novelIndex].sideCharacters!.some(c => c.id === character.id);
    if (!exists) {
      novels[novelIndex].sideCharacters!.push(character);
      // 更新 sideCharacterIds
      if (!novels[novelIndex].sideCharacterIds) {
        novels[novelIndex].sideCharacterIds = [];
      }
      novels[novelIndex].sideCharacterIds!.push(character.id);
    }

    novels[novelIndex].updatedAt = Date.now();
    await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
  } catch (error) {
    console.error('Error adding side character to novel:', error);
  }
};

// 同步角色库到小说数据库（同名覆盖）
export const syncCharactersToNovel = async (novelId: string): Promise<void> => {
  try {
    const novels = await getAllNovels();
    const novelIndex = novels.findIndex(n => n.id === novelId);
    if (novelIndex === -1) return;

    const novel = novels[novelIndex];
    const allCharacters = await getAllCharacters();
    
    // 获取小说当前的角色列表（通过ID）
    const currentCharacterIds = [
      novel.maleCharacterId,
      novel.femaleCharacterId,
      ...novel.sideCharacterIds
    ].filter(Boolean);

    // 遍历角色库，检查是否需要同步
    for (const char of allCharacters) {
      if (!currentCharacterIds.includes(char.id)) continue;
      
      // 在角色库中找到对应的角色
      const libraryChar = allCharacters.find(c => c.id === char.id);
      if (!libraryChar) continue;

      // 检查小说数据库中是否已有同名角色
      let updated = false;

      // 检查男主
      if (novel.maleCharacterData && 
          (novel.maleCharacterData.name === libraryChar.name || novel.maleCharacterData.id === libraryChar.id)) {
        novels[novelIndex].maleCharacterData = {
          ...novel.maleCharacterData,
          name: libraryChar.name,
          gender: libraryChar.gender,
          age: libraryChar.age,
          appearance: libraryChar.appearance,
          personality: libraryChar.personality,
          background: libraryChar.background,
        };
        updated = true;
      }
      
      // 检查女主
      if (!updated && novel.femaleCharacterData && 
          (novel.femaleCharacterData.name === libraryChar.name || novel.femaleCharacterData.id === libraryChar.id)) {
        novels[novelIndex].femaleCharacterData = {
          ...novel.femaleCharacterData,
          name: libraryChar.name,
          gender: libraryChar.gender,
          age: libraryChar.age,
          appearance: libraryChar.appearance,
          personality: libraryChar.personality,
          background: libraryChar.background,
        };
        updated = true;
      }
      
      // 检查配角
      if (!updated && novels[novelIndex].sideCharacters) {
        const sideIndex = novels[novelIndex].sideCharacters!.findIndex(
          c => c.name === libraryChar.name || c.id === libraryChar.id
        );
        if (sideIndex !== -1) {
          novels[novelIndex].sideCharacters![sideIndex] = {
            ...novels[novelIndex].sideCharacters![sideIndex],
            name: libraryChar.name,
            gender: libraryChar.gender,
            age: libraryChar.age,
            appearance: libraryChar.appearance,
            personality: libraryChar.personality,
            background: libraryChar.background,
          };
        }
      }
    }

    novels[novelIndex].updatedAt = Date.now();
    await AsyncStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
  } catch (error) {
    console.error('Error syncing characters to novel:', error);
  }
};
