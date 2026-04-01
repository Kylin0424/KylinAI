import { WorldSetting } from '../models/Novel';
import http from '@ohos.net.http';

/**
 * AI服务 - 负责与后端通信生成小说内容
 */
export class AIService {
  private baseUrl: string = 'http://localhost:9091/api/v1';

  /**
   * 流式生成楔子内容
   */
  async generatePrologue(
    setting: WorldSetting,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const httpRequest = http.createHttp();
      
      const url = `${this.baseUrl}/novel/prologue`;
      const body = JSON.stringify({
        worldName: setting.worldName,
        eraBackground: setting.eraBackground,
        season: setting.season
      });

      httpRequest.on('dataReceive', (data) => {
        const text = data.result as string;
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.substring(6);
            if (content === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(content);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              // 非JSON格式，直接作为内容处理
              if (content !== '[DONE]') {
                onChunk(content);
              }
            }
          }
        }
      });

      httpRequest.on('dataEnd', () => {
        onComplete();
      });

      await httpRequest.requestInStream(url, {
        method: http.RequestMethod.POST,
        header: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        extraData: body,
        connectTimeout: 60000,
        readTimeout: 120000
      });

    } catch (error) {
      onError(`生成失败: ${error.message}`);
    }
  }

  /**
   * 生成下一章节建议
   */
  async generateNextChapter(
    novelId: string,
    previousChapters: string[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const httpRequest = http.createHttp();
      
      const url = `${this.baseUrl}/novel/next-chapter`;
      const body = JSON.stringify({
        novelId,
        previousChapters
      });

      httpRequest.on('dataReceive', (data) => {
        const text = data.result as string;
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.substring(6);
            if (content === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(content);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              if (content !== '[DONE]') {
                onChunk(content);
              }
            }
          }
        }
      });

      httpRequest.on('dataEnd', () => {
        onComplete();
      });

      await httpRequest.requestInStream(url, {
        method: http.RequestMethod.POST,
        header: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        extraData: body,
        connectTimeout: 60000,
        readTimeout: 120000
      });

    } catch (error) {
      onError(`生成失败: ${error.message}`);
    }
  }
}

export default new AIService();
