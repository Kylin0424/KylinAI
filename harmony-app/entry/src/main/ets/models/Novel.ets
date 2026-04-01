/**
 * 小说章节模型
 */
export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
}

/**
 * 小说作品模型
 */
export interface Novel {
  id: string;
  title: string;
  worldName: string;
  eraBackground: string;
  season: string;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 世界背景设定
 */
export interface WorldSetting {
  worldName: string;
  eraBackground: string;
  season: string;
}
