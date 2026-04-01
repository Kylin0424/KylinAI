import { Novel, Chapter } from '../models/Novel';
import preferences from '@ohos.data.preferences';

/**
 * 本地存储服务
 */
export class StorageService {
  private static readonly NOVELS_KEY = 'novels';
  private preferences: preferences.Preferences | null = null;

  /**
   * 初始化存储
   */
  async init(context: Context): Promise<void> {
    try {
      this.preferences = await preferences.getPreferences(context, 'novel_storage');
    } catch (error) {
      console.error('初始化存储失败:', error);
    }
  }

  /**
   * 保存小说
   */
  async saveNovel(novel: Novel): Promise<void> {
    try {
      const novels = await this.getAllNovels();
      const index = novels.findIndex(n => n.id === novel.id);
      
      if (index >= 0) {
        novels[index] = novel;
      } else {
        novels.push(novel);
      }
      
      await this.preferences?.put(StorageService.NOVELS_KEY, JSON.stringify(novels));
      await this.preferences?.flush();
    } catch (error) {
      console.error('保存小说失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有小说
   */
  async getAllNovels(): Promise<Novel[]> {
    try {
      const data = await this.preferences?.get(StorageService.NOVELS_KEY, '[]') as string;
      return JSON.parse(data);
    } catch (error) {
      console.error('获取小说列表失败:', error);
      return [];
    }
  }

  /**
   * 获取单个小说
   */
  async getNovelById(id: string): Promise<Novel | null> {
    const novels = await this.getAllNovels();
    return novels.find(n => n.id === id) || null;
  }

  /**
   * 删除小说
   */
  async deleteNovel(id: string): Promise<void> {
    try {
      const novels = await this.getAllNovels();
      const filtered = novels.filter(n => n.id !== id);
      await this.preferences?.put(StorageService.NOVELS_KEY, JSON.stringify(filtered));
      await this.preferences?.flush();
    } catch (error) {
      console.error('删除小说失败:', error);
      throw error;
    }
  }

  /**
   * 生成唯一ID
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default new StorageService();
