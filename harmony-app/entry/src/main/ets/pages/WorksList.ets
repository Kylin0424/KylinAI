import { AppTheme, Card } from '../components/CommonComponents';
import { Novel } from '../models/Novel';
import storageService from '../services/StorageService';
import router from '@ohos.router';

@Entry
@Component
struct WorksList {
  @State novels: Novel[] = [];
  @State isLoading: boolean = true;

  aboutToAppear() {
    this.loadNovels();
  }

  /**
   * 加载所有作品
   */
  private async loadNovels() {
    this.isLoading = true;
    this.novels = await storageService.getAllNovels();
    this.isLoading = false;
  }

  /**
   * 删除作品
   */
  private async deleteNovel(novelId: string) {
    await storageService.deleteNovel(novelId);
    await this.loadNovels();
  }

  /**
   * 格式化日期
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
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
        
        Text('我的作品')
          .fontSize(AppTheme.FontSizeSubtitle)
          .fontWeight(FontWeight.Bold)
          .fontColor(AppTheme.TextPrimary)
        
        Blank()
        
        // 占位，保持标题居中
        Text('')
          .width(60)
      }
      .width('100%')
      .height(56)
      .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
      
      // 作品列表
      if (this.isLoading) {
        Column() {
          LoadingProgress()
            .width(40)
            .height(40)
            .color(AppTheme.Primary)
          
          Text('加载中...')
            .fontSize(AppTheme.FontSizeCaption)
            .fontColor(AppTheme.TextMuted)
            .margin({ top: AppTheme.SpacingMD })
        }
        .width('100%')
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
      } else if (this.novels.length === 0) {
        // 空状态
        Column() {
          Text('📝')
            .fontSize(60)
            .margin({ bottom: AppTheme.SpacingMD })
          
          Text('还没有作品')
            .fontSize(AppTheme.FontSizeSubtitle)
            .fontColor(AppTheme.TextPrimary)
            .margin({ bottom: AppTheme.SpacingSM })
          
          Text('点击首页"开始创作"创建你的第一部作品')
            .fontSize(AppTheme.FontSizeCaption)
            .fontColor(AppTheme.TextMuted)
            .textAlign(TextAlign.Center)
            .width('80%')
        }
        .width('100%')
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
      } else {
        List() {
          ForEach(this.novels, (novel: Novel) => {
            ListItem() {
              Card({
                content: () => {
                  Column() {
                    // 世界名字
                    Text(novel.worldName)
                      .fontSize(AppTheme.FontSizeSubtitle)
                      .fontWeight(FontWeight.Bold)
                      .fontColor(AppTheme.TextPrimary)
                      .width('100%')
                      .margin({ bottom: AppTheme.SpacingSM })
                    
                    // 设定标签
                    Row() {
                      Text(novel.eraBackground)
                        .fontSize(AppTheme.FontSizeSmall)
                        .fontColor(AppTheme.TextOnPrimary)
                        .backgroundColor(AppTheme.Primary)
                        .borderRadius(4)
                        .padding({ left: AppTheme.SpacingSM, right: AppTheme.SpacingSM, top: 2, bottom: 2 })
                      
                      Text(novel.season)
                        .fontSize(AppTheme.FontSizeSmall)
                        .fontColor(AppTheme.TextSecondary)
                        .backgroundColor(AppTheme.BackgroundSecondary)
                        .borderRadius(4)
                        .padding({ left: AppTheme.SpacingSM, right: AppTheme.SpacingSM, top: 2, bottom: 2 })
                        .margin({ left: AppTheme.SpacingSM })
                    }
                    .width('100%')
                    .margin({ bottom: AppTheme.SpacingSM })
                    
                    // 统计信息
                    Row() {
                      Text(`${novel.chapters.length} 章节`)
                        .fontSize(AppTheme.FontSizeCaption)
                        .fontColor(AppTheme.TextMuted)
                      
                      Text(' | ')
                        .fontSize(AppTheme.FontSizeCaption)
                        .fontColor(AppTheme.TextMuted)
                      
                      Text(this.formatDate(novel.updatedAt))
                        .fontSize(AppTheme.FontSizeCaption)
                        .fontColor(AppTheme.TextMuted)
                    }
                    .width('100%')
                  }
                  .width('100%')
                  .alignItems(HorizontalAlign.Start)
                }
              })
              .width('100%')
              .margin({ bottom: AppTheme.SpacingMD })
              .onClick(() => {
                // 跳转到创作页面继续编辑
                router.pushUrl({
                  url: 'pages/NovelWriting',
                  params: {
                    worldName: novel.worldName,
                    eraBackground: novel.eraBackground,
                    season: novel.season,
                    novelId: novel.id
                  }
                });
              })
            }
            .swipeAction({ end: this.DeleteButtonBuilder(novel.id) })
          })
        }
        .width('100%')
        .layoutWeight(1)
        .padding({ left: AppTheme.SpacingLG, right: AppTheme.SpacingLG, top: AppTheme.SpacingMD })
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(AppTheme.Background)
  }

  @Builder
  DeleteButtonBuilder(novelId: string) {
    Button('删除')
      .height('100%')
      .backgroundColor(AppTheme.EditorialRed)
      .fontColor(AppTheme.TextOnPrimary)
      .borderRadius(0)
      .onClick(() => {
        this.deleteNovel(novelId);
      })
  }
}
