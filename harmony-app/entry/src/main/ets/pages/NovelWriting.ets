import { AppTheme, Card, PrimaryButton, LoadingSpinner } from '../components/CommonComponents';
import { Novel, Chapter, WorldSetting } from '../models/Novel';
import aiService from '../services/AIService';
import storageService from '../services/StorageService';
import router from '@ohos.router';

@Entry
@Component
struct NovelWriting {
  @State novel: Novel | null = null;
  @State currentChapterContent: string = '';
  @State isGenerating: boolean = false;
  @State generatedPrologue: string = '';
  @State showPrologueModal: boolean = false;
  @State chapterTitle: string = '第一章';
  @State isEditing: boolean = true;
  
  private setting: WorldSetting = {
    worldName: '',
    eraBackground: '',
    season: ''
  };
  
  private scrollView: Scroller = new Scroller();

  aboutToAppear() {
    // 获取路由参数
    const params = router.getParams() as WorldSetting;
    if (params) {
      this.setting = params;
      this.initNovel();
    }
  }

  /**
   * 初始化小说并生成楔子
   */
  private async initNovel() {
    // 创建新小说
    this.novel = {
      id: storageService.generateId(),
      title: '未命名作品',
      worldName: this.setting.worldName,
      eraBackground: this.setting.eraBackground,
      season: this.setting.season,
      chapters: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 自动生成楔子
    this.generatePrologue();
  }

  /**
   * 生成楔子
   */
  private async generatePrologue() {
    this.isGenerating = true;
    this.generatedPrologue = '';
    this.showPrologueModal = true;
    
    await aiService.generatePrologue(
      this.setting,
      (chunk) => {
        // 流式接收内容
        this.generatedPrologue += chunk;
      },
      () => {
        // 生成完成，保存楔子章节
        this.isGenerating = false;
        if (this.novel) {
          const prologue: Chapter = {
            id: storageService.generateId(),
            title: '第零章 楔子',
            content: this.generatedPrologue,
            order: 0,
            createdAt: new Date().toISOString()
          };
          this.novel.chapters.push(prologue);
          this.saveNovel();
        }
      },
      (error) => {
        this.isGenerating = false;
        console.error('生成楔子失败:', error);
      }
    );
  }

  /**
   * 保存小说
   */
  private async saveNovel() {
    if (this.novel) {
      this.novel.updatedAt = new Date().toISOString();
      await storageService.saveNovel(this.novel);
    }
  }

  /**
   * 保存当前章节
   */
  private async saveCurrentChapter() {
    if (this.novel && this.currentChapterContent) {
      // 查找是否已有该章节
      const existingIndex = this.novel.chapters.findIndex(
        c => c.order === this.novel!.chapters.length
      );
      
      if (existingIndex >= 0) {
        // 更新现有章节
        this.novel.chapters[existingIndex].content = this.currentChapterContent;
      } else {
        // 添加新章节
        const newChapter: Chapter = {
          id: storageService.generateId(),
          title: this.chapterTitle,
          content: this.currentChapterContent,
          order: this.novel.chapters.length,
          createdAt: new Date().toISOString()
        };
        this.novel.chapters.push(newChapter);
      }
      
      await this.saveNovel();
    }
  }

  build() {
    Column() {
      // 顶部导航栏
      Row() {
        Button() {
          Text('← 返回')
            .fontColor(AppTheme.Primary)
            .fontSize(AppTheme.FontSizeBody)
        }
        .backgroundColor(Color.Transparent)
        .onClick(() => {
          router.back();
        })
        
        Blank()
        
        Text(this.novel?.worldName || '创作中')
          .fontSize(AppTheme.FontSizeSubtitle)
          .fontWeight(FontWeight.Bold)
          .fontColor(AppTheme.TextPrimary)
        
        Blank()
        
        Button('保存')
          .backgroundColor(AppTheme.Primary)
          .fontColor(AppTheme.TextOnPrimary)
          .borderRadius(AppTheme.BorderRadiusSmall)
          .onClick(() => {
            this.saveCurrentChapter();
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
      
      // 章节列表（横向滚动）
      if (this.novel && this.novel.chapters.length > 0) {
        Scroll() {
          Row() {
            ForEach(this.novel.chapters, (chapter: Chapter, index: number) => {
              Button(chapter.title)
                .height(36)
                .backgroundColor(
                  this.chapterTitle === chapter.title 
                    ? AppTheme.Primary 
                    : AppTheme.BackgroundSecondary
                )
                .fontColor(
                  this.chapterTitle === chapter.title 
                    ? AppTheme.TextOnPrimary 
                    : AppTheme.TextSecondary
                )
                .borderRadius(18)
                .fontSize(AppTheme.FontSizeSmall)
                .margin({ right: AppTheme.SpacingSM })
                .onClick(() => {
                  this.chapterTitle = chapter.title;
                  this.currentChapterContent = chapter.content;
                  this.isEditing = true;
                })
            })
            
            // 添加新章节按钮
            Button('+ 新章节')
              .height(36)
              .backgroundColor(AppTheme.BackgroundSecondary)
              .fontColor(AppTheme.Primary)
              .borderRadius(18)
              .fontSize(AppTheme.FontSizeSmall)
              .onClick(() => {
                const newOrder = this.novel?.chapters.length || 0;
                this.chapterTitle = `第${newOrder + 1}章`;
                this.currentChapterContent = '';
                this.isEditing = true;
              })
          }
          .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
        }
        .width('100%')
        .height(56)
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
      }
      
      // 章节标题
      Text(this.chapterTitle)
        .fontSize(AppTheme.FontSizeSubtitle)
        .fontWeight(FontWeight.Bold)
        .fontColor(AppTheme.TextPrimary)
        .width('100%')
        .padding(AppTheme.SpacingMD)
        .textAlign(TextAlign.Start)
      
      // 编辑区域
      Scroll() {
        TextArea({ text: this.currentChapterContent, placeholder: '开始书写你的故事...' })
          .width('100%')
          .height('100%')
          .backgroundColor(AppTheme.Background)
          .fontSize(AppTheme.FontSizeBody)
          .fontColor(AppTheme.TextPrimary)
          .lineHeight(28)
          .onChange((value) => {
            this.currentChapterContent = value;
          })
      }
      .layoutWeight(1)
      .width('100%')
      .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
      
      // 底部工具栏
      Row() {
        Button('AI 续写')
          .height(40)
          .backgroundColor(AppTheme.Primary)
          .fontColor(AppTheme.TextOnPrimary)
          .borderRadius(AppTheme.BorderRadiusSmall)
          .enabled(!this.isGenerating)
          .onClick(() => {
            // TODO: 调用AI续写
          })
        
        Blank()
        
        Text(`${this.currentChapterContent.length} 字`)
          .fontSize(AppTheme.FontSizeCaption)
          .fontColor(AppTheme.TextMuted)
      }
      .width('100%')
      .height(60)
      .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(AppTheme.Background)
    .bindSheet($$this.showPrologueModal, this.PrologueSheetBuilder(), {
      height: '80%',
      backgroundColor: AppTheme.Background,
      dragBar: false
    })
  }

  @Builder
  PrologueSheetBuilder() {
    Column() {
      // 标题
      Row() {
        Text('第零章 楔子')
          .fontSize(AppTheme.FontSizeSubtitle)
          .fontWeight(FontWeight.Bold)
          .fontColor(AppTheme.TextPrimary)
        
        Blank()
        
        if (!this.isGenerating) {
          Button('关闭')
            .backgroundColor(AppTheme.BackgroundSecondary)
            .fontColor(AppTheme.TextPrimary)
            .borderRadius(AppTheme.BorderRadiusSmall)
            .onClick(() => {
              this.showPrologueModal = false;
            })
        }
      }
      .width('100%')
      .padding(AppTheme.SpacingMD)
      
      // 内容区域
      Scroll() {
        Column() {
          if (this.generatedPrologue) {
            Text(this.generatedPrologue)
              .fontSize(AppTheme.FontSizeBody)
              .fontColor(AppTheme.TextPrimary)
              .lineHeight(28)
              .width('100%')
          } else if (this.isGenerating) {
            Column() {
              LoadingSpinner({ size: 40 })
              Text('AI 正在为你创作楔子...')
                .fontSize(AppTheme.FontSizeCaption)
                .fontColor(AppTheme.TextMuted)
                .margin({ top: AppTheme.SpacingMD })
            }
            .width('100%')
            .height(200)
            .justifyContent(FlexAlign.Center)
          }
        }
        .width('100%')
        .padding(AppTheme.SpacingMD)
      }
      .layoutWeight(1)
      .width('100%')
      
      // 底部操作
      if (!this.isGenerating) {
        PrimaryButton({
          text: '开始第一章',
          onPress: () => {
            this.showPrologueModal = false;
            this.chapterTitle = '第一章';
            this.currentChapterContent = '';
            this.isEditing = true;
          }
        })
        .width('90%')
        .margin({ bottom: AppTheme.SpacingLG })
      }
    }
    .width('100%')
    .height('100%')
  }
}
