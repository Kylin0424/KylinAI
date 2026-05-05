import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllNovels } from './novelStorage';

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: number;
  height: string;
  weight?: string; // 体重
  group?: string; // 所属团体
  position?: string; // 职位
  occupation: string;
  education?: string; // 学历
  personality: string;
  experience: string;
  familyMembersBrief?: string; // 家庭成员简述
  familyBackground: string;
  appearance: string;
  specialTraits: string;
  background?: string; // 背景故事
  traits?: string[]; // 人物标签
  avatarUrl?: string; // AI生成的写实头像URL
  createdAt: number;
  novelId?: string; // 所属小说ID
  roleType?: 'male_lead' | 'female_lead' | 'npc' | 'temp'; // 角色类型，temp为临时角色
  relationToProtagonist?: string; // 与主角的关系
  isTemporary?: boolean; // 是否为临时角色（AI自动创建）
  // 角色记忆系统
  shortTermMemory?: string[]; // 短期经历（每次续写追加的细节事件）
  longTermMemory?: string[]; // 长期记忆（定期整合的精炼记忆）
  memoryUpdateCount?: number; // 续写次数计数器（用于触发整合）
}

export interface CharacterRelation {
  id: string;
  characterId: string;
  relatedCharacterId: string;
  relationType: string; // 如：父亲、母亲、配偶、朋友、敌人等
  reverseRelation?: string; // 反向关系（如：父亲 -> 儿子）
  description: string;
  createdAt: number;
  novelId?: string; // 所属小说ID
}

// 关系网络节点
export interface RelationNetworkNode {
  characterId: string;
  characterName: string;
  characterGender: string;
  relations: {
    targetId: string;
    targetName: string;
    targetGender: string;
    relationType: string;
    reverseRelation?: string;
  }[];
}

const CHARACTERS_KEY = '@novel_app_characters';
const RELATIONS_KEY = '@novel_app_relations';

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 获取所有角色
export const getAllCharacters = async (): Promise<Character[]> => {
  try {
    const data = await AsyncStorage.getItem(CHARACTERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting characters:', error);
    return [];
  }
};

// 保存角色
export const saveCharacter = async (character: Character): Promise<void> => {
  try {
    const characters = await getAllCharacters();
    characters.push(character);
    await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
  } catch (error) {
    console.error('Error saving character:', error);
    throw error;
  }
};

// 更新角色
export const updateCharacter = async (character: Character): Promise<void> => {
  try {
    const characters = await getAllCharacters();
    const index = characters.findIndex(c => c.id === character.id);
    if (index !== -1) {
      characters[index] = character;
      await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    }
  } catch (error) {
    console.error('Error updating character:', error);
    throw error;
  }
};

// 删除角色
export const deleteCharacter = async (characterId: string): Promise<void> => {
  try {
    const characters = await getAllCharacters();
    const filtered = characters.filter(c => c.id !== characterId);
    await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(filtered));
    
    // 同时删除相关的关系
    const relations = await getAllRelations();
    const filteredRelations = relations.filter(
      r => r.characterId !== characterId && r.relatedCharacterId !== characterId
    );
    await AsyncStorage.setItem(RELATIONS_KEY, JSON.stringify(filteredRelations));
  } catch (error) {
    console.error('Error deleting character:', error);
    throw error;
  }
};

// 批量删除角色
export const deleteCharacters = async (characterIds: string[]): Promise<void> => {
  await Promise.all(characterIds.map(id => forceDeleteCharacters([id])));
};

// 强制批量删除角色（无论是否被小说绑定）
export const forceDeleteCharacters = async (characterIds: string[]): Promise<void> => {
  try {
    // 1. 删除角色本身
    const characters = await getAllCharacters();
    const filteredCharacters = characters.filter(c => !characterIds.includes(c.id));
    await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(filteredCharacters));

    // 2. 删除角色相关的旧关系
    const relations = await getAllRelations();
    const filteredRelations = relations.filter(
      r => !characterIds.includes(r.characterId) && !characterIds.includes(r.relatedCharacterId)
    );
    await AsyncStorage.setItem(RELATIONS_KEY, JSON.stringify(filteredRelations));

    // 3. 清理关系网络中的相关数据
    const novels = await getAllNovels();
    for (const novel of novels) {
      if (novel.id) {
        try {
          const network = await getRelationNetwork(novel.id);
          const cleanedNetwork = network.map(node => ({
            ...node,
            relations: node.relations.filter(r => !characterIds.includes(r.targetId))
          })).filter(node => !characterIds.includes(node.characterId));
          await saveRelationNetwork(novel.id, cleanedNetwork);
        } catch (error) {
          console.error(`[forceDeleteCharacters] Error cleaning relation network for novel ${novel.id}:`, error);
        }
      }
    }

    console.log('[forceDeleteCharacters] Successfully deleted characters and cleaned relations:', characterIds);
  } catch (error) {
    console.error('[forceDeleteCharacters] Error deleting characters:', error);
    throw error;
  }
};

// 获取所有关系
export const getAllRelations = async (): Promise<CharacterRelation[]> => {
  try {
    const data = await AsyncStorage.getItem(RELATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting relations:', error);
    return [];
  }
};

// 获取角色的所有关系
export const getCharacterRelations = async (characterId: string): Promise<CharacterRelation[]> => {
  try {
    const relations = await getAllRelations();
    return relations.filter(
      r => r.characterId === characterId || r.relatedCharacterId === characterId
    );
  } catch (error) {
    console.error('Error getting character relations:', error);
    return [];
  }
};

// 保存关系
export const saveRelation = async (relation: CharacterRelation): Promise<void> => {
  try {
    const relations = await getAllRelations();
    relations.push(relation);
    await AsyncStorage.setItem(RELATIONS_KEY, JSON.stringify(relations));
  } catch (error) {
    console.error('Error saving relation:', error);
    throw error;
  }
};

// 删除关系
export const deleteRelation = async (relationId: string): Promise<void> => {
  try {
    const relations = await getAllRelations();
    const filtered = relations.filter(r => r.id !== relationId);
    await AsyncStorage.setItem(RELATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting relation:', error);
    throw error;
  }
};

// 清空所有数据
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([CHARACTERS_KEY, RELATIONS_KEY]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// 获取未关联小说的角色（可用于选择）
export const getAvailableCharacters = async (): Promise<Character[]> => {
  try {
    const characters = await getAllCharacters();
    return characters.filter(c => !c.novelId);
  } catch (error) {
    console.error('Error getting available characters:', error);
    return [];
  }
};

// 获取指定小说的角色
export const getNovelCharacters = async (novelId: string): Promise<Character[]> => {
  try {
    const characters = await getAllCharacters();
    return characters.filter(c => c.novelId === novelId);
  } catch (error) {
    console.error('Error getting novel characters:', error);
    return [];
  }
};

// 关联角色到小说
export const linkCharacterToNovel = async (
  characterId: string,
  novelId: string,
  roleType: 'male_lead' | 'female_lead' | 'npc'
): Promise<void> => {
  try {
    const characters = await getAllCharacters();
    const index = characters.findIndex(c => c.id === characterId);
    if (index !== -1) {
      characters[index].novelId = novelId;
      characters[index].roleType = roleType;
      await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    }
  } catch (error) {
    console.error('Error linking character to novel:', error);
    throw error;
  }
};

// 解除角色与小说的关联
export const unlinkCharacterFromNovel = async (characterId: string): Promise<void> => {
  try {
    const characters = await getAllCharacters();
    const index = characters.findIndex(c => c.id === characterId);
    if (index !== -1) {
      characters[index].novelId = undefined;
      characters[index].roleType = undefined;
      await AsyncStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    }
  } catch (error) {
    console.error('Error unlinking character from novel:', error);
    throw error;
  }
};

// 获取角色详情
export const getCharacterById = async (characterId: string): Promise<Character | null> => {
  try {
    const characters = await getAllCharacters();
    return characters.find(c => c.id === characterId) || null;
  } catch (error) {
    console.error('Error getting character:', error);
    return null;
  }
};

// 获取可用角色（按性别筛选）
export const getAvailableCharactersByGender = async (gender?: '男' | '女'): Promise<Character[]> => {
  try {
    const characters = await getAvailableCharacters();
    if (!gender) return characters;
    return characters.filter(c => c.gender === gender);
  } catch (error) {
    console.error('Error getting available characters by gender:', error);
    return [];
  }
};

// ==================== 关系网络功能 ====================

const RELATION_NETWORK_KEY = '@novel_app_relation_network';

// 获取小说的关系网络
export const getRelationNetwork = async (novelId: string): Promise<RelationNetworkNode[]> => {
  try {
    const data = await AsyncStorage.getItem(`${RELATION_NETWORK_KEY}_${novelId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting relation network:', error);
    return [];
  }
};

// 保存关系网络
export const saveRelationNetwork = async (novelId: string, network: RelationNetworkNode[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${RELATION_NETWORK_KEY}_${novelId}`, JSON.stringify(network));
  } catch (error) {
    console.error('Error saving relation network:', error);
    throw error;
  }
};

// 添加关系到网络（双向）
export const addRelationToNetwork = async (
  novelId: string,
  sourceId: string,
  sourceName: string,
  sourceGender: string,
  targetId: string,
  targetName: string,
  targetGender: string,
  relationType: string,
  reverseRelation?: string
): Promise<void> => {
  try {
    const network = await getRelationNetwork(novelId);
    
    // 查找或创建源节点
    let sourceNode = network.find(n => n.characterId === sourceId);
    if (!sourceNode) {
      sourceNode = {
        characterId: sourceId,
        characterName: sourceName,
        characterGender: sourceGender,
        relations: [],
      };
      network.push(sourceNode);
    }
    
    // 添加正向关系
    const existingRelation = sourceNode.relations.find(r => r.targetId === targetId);
    if (existingRelation) {
      existingRelation.relationType = relationType;
      existingRelation.reverseRelation = reverseRelation;
    } else {
      sourceNode.relations.push({
        targetId,
        targetName,
        targetGender,
        relationType,
        reverseRelation,
      });
    }
    
    // 添加反向关系
    if (reverseRelation) {
      let targetNode = network.find(n => n.characterId === targetId);
      if (!targetNode) {
        targetNode = {
          characterId: targetId,
          characterName: targetName,
          characterGender: targetGender,
          relations: [],
        };
        network.push(targetNode);
      }
      
      const existingReverse = targetNode.relations.find(r => r.targetId === sourceId);
      if (existingReverse) {
        existingReverse.relationType = reverseRelation;
        existingReverse.reverseRelation = relationType;
      } else {
        targetNode.relations.push({
          targetId: sourceId,
          targetName: sourceName,
          targetGender: sourceGender,
          relationType: reverseRelation,
          reverseRelation: relationType,
        });
      }
    }
    
    await saveRelationNetwork(novelId, network);
  } catch (error) {
    console.error('Error adding relation to network:', error);
    throw error;
  }
};

// 从网络中移除关系
export const removeRelationFromNetwork = async (
  novelId: string,
  sourceId: string,
  targetId: string
): Promise<void> => {
  try {
    const network = await getRelationNetwork(novelId);
    
    // 移除正向关系
    const sourceNode = network.find(n => n.characterId === sourceId);
    if (sourceNode) {
      sourceNode.relations = sourceNode.relations.filter(r => r.targetId !== targetId);
    }
    
    // 移除反向关系
    const targetNode = network.find(n => n.characterId === targetId);
    if (targetNode) {
      targetNode.relations = targetNode.relations.filter(r => r.targetId !== sourceId);
    }
    
    await saveRelationNetwork(novelId, network);
  } catch (error) {
    console.error('Error removing relation from network:', error);
    throw error;
  }
};

// 查询两个角色之间的关系
export const getRelationBetween = async (
  novelId: string,
  sourceId: string,
  targetId: string
): Promise<{ relationType: string; reverseRelation?: string } | null> => {
  try {
    const network = await getRelationNetwork(novelId);
    const sourceNode = network.find(n => n.characterId === sourceId);
    
    if (sourceNode) {
      const relation = sourceNode.relations.find(r => r.targetId === targetId);
      if (relation) {
        return {
          relationType: relation.relationType,
          reverseRelation: relation.reverseRelation,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting relation between:', error);
    return null;
  }
};

// 获取角色的所有关系
export const getCharacterRelationsFromNetwork = async (
  novelId: string,
  characterId: string
): Promise<{ targetId: string; targetName: string; relationType: string; reverseRelation?: string }[]> => {
  try {
    const network = await getRelationNetwork(novelId);
    const node = network.find(n => n.characterId === characterId);
    return node?.relations || [];
  } catch (error) {
    console.error('Error getting character relations from network:', error);
    return [];
  }
};

// 根据小说角色初始化关系网络
export const initializeRelationNetwork = async (novelId: string): Promise<void> => {
  try {
    const characters = await getNovelCharacters(novelId);
    const network: RelationNetworkNode[] = characters.map(c => ({
      characterId: c.id,
      characterName: c.name,
      characterGender: c.gender,
      relations: [],
    }));
    
    await saveRelationNetwork(novelId, network);
  } catch (error) {
    console.error('Error initializing relation network:', error);
    throw error;
  }
};

// 清空关系网络
export const clearRelationNetwork = async (novelId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${RELATION_NETWORK_KEY}_${novelId}`);
  } catch (error) {
    console.error('Error clearing relation network:', error);
    throw error;
  }
};

// 获取关系网络的JSON描述（用于AI理解）
export const getRelationNetworkDescription = async (novelId: string): Promise<string> => {
  try {
    const network = await getRelationNetwork(novelId);
    
    if (network.length === 0) {
      return '暂无角色关系网络数据';
    }
    
    const descriptions: string[] = [];
    
    network.forEach(node => {
      if (node.relations.length > 0) {
        node.relations.forEach(r => {
          descriptions.push(`${node.characterName}(${r.relationType})→${r.targetName}`);
        });
      }
    });
    
    return descriptions.length > 0 ? descriptions.join('；') : '暂无角色关系';
  } catch (error) {
    console.error('Error getting relation network description:', error);
    return '获取关系网络失败';
  }
};
