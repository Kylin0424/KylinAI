import { AppTheme, Card, PrimaryButton, Tag } from '../components/CommonComponents';
import { WorldSetting } from '../models/Novel';
import router from '@ohos.router';

@Entry
@Component
struct Index {
  @State showSettingModal: boolean = false;
  @State worldName: string = '';
  @State eraBackground: string = '';
  @State season: string = '';
  
  // 快速选择标签
  private eraOptions: string[] = ['古代', '现代', '未来', '架空', '仙侠'];
  private seasonOptions: string[] = ['春', '夏', '秋', '冬', '四季交替'];

  build() {
    Column() {
      // 顶部品牌区域
      Column() {
        Text('齐思妙说')
          .fontSize(42)
          .fontWeight(FontWeight.Bold)
          .fontColor(AppTheme.Primary)
          .letterSpacing(8)
          .margin({ top: 80 })
        
        Text('AI 驱动的旁观叙事')
          .fontSize(AppTheme.FontSizeCaption)
          .fontColor(AppTheme.TextMuted)
          .letterSpacing(2)
          .margin({ top: AppTheme.SpacingSM })
      }
      .width('100%')
      .alignItems(HorizontalAlign.Center)
      .padding({ bottom: AppTheme.SpacingXL })
      
      // 主内容区域
      Column() {
        // 功能介绍卡片
        Card({
          content: () => {
            Column() {
              Text('创作模式')
                .fontSize(AppTheme.FontSizeSubtitle)
                .fontWeight(FontWeight.Bold)
                .fontColor(AppTheme.TextPrimary)
                .margin({ bottom: AppTheme.SpacingSM })
              
              Text('以旁观者视角，让AI为你编织独特的故事。设置世界背景，开启你的创作之旅。')
                .fontSize(AppTheme.FontSizeBody)
                .fontColor(AppTheme.TextSecondary)
                .lineHeight(24)
            }
            .width('100%')
            .alignItems(HorizontalAlign.Start)
          }
        })
        .margin({ bottom: AppTheme.SpacingLG })
        
        // 开始创作按钮
        PrimaryButton({
          text: '开始创作',
          onPress: () => {
            this.showSettingModal = true;
          }
        })
        .margin({ bottom: AppTheme.SpacingMD })
        
        // 我的作品按钮
        Button('我的作品')
          .width('100%')
          .height(50)
          .backgroundColor(AppTheme.BackgroundSecondary)
          .borderRadius(AppTheme.BorderRadius)
          .fontColor(AppTheme.TextPrimary)
          .fontSize(AppTheme.FontSizeBody)
          .onClick(() => {
            router.pushUrl({ url: 'pages/WorksList' });
          })
      }
      .width('100%')
      .padding({ left: AppTheme.SpacingLG, right: AppTheme.SpacingLG })
      
      Blank()
      
      // 底部装饰线
      Row()
        .width(60)
        .height(3)
        .backgroundColor(AppTheme.Accent)
        .borderRadius(1.5)
        .margin({ bottom: 40 })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(AppTheme.Background)
    .bindSheet($$this.showSettingModal, this.SettingSheetBuilder(), {
      height: '70%',
      backgroundColor: AppTheme.Background,
      dragBar: true
    })
  }

  @Builder
  SettingSheetBuilder() {
    Column() {
      // 标题
      Text('世界背景设定')
        .fontSize(AppTheme.FontSizeSubtitle)
        .fontWeight(FontWeight.Bold)
        .fontColor(AppTheme.TextPrimary)
        .margin({ bottom: AppTheme.SpacingLG })
      
      // 世界名字
      Column() {
        Text('世界名字')
          .fontSize(AppTheme.FontSizeCaption)
          .fontColor(AppTheme.TextSecondary)
          .margin({ bottom: AppTheme.SpacingXS })
        
        TextInput({ text: this.worldName, placeholder: '例如：艾泽拉斯、中土世界...' })
          .width('100%')
          .height(48)
          .backgroundColor(AppTheme.BackgroundSecondary)
          .borderRadius(AppTheme.BorderRadiusSmall)
          .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
          .onChange((value) => {
            this.worldName = value;
          })
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .margin({ bottom: AppTheme.SpacingLG })
      
      // 年代背景
      Column() {
        Text('年代背景')
          .fontSize(AppTheme.FontSizeCaption)
          .fontColor(AppTheme.TextSecondary)
          .margin({ bottom: AppTheme.SpacingSM })
        
        Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
          ForEach(this.eraOptions, (option: string) => {
            Tag({
              text: option,
              selected: this.eraBackground === option,
              onPress: () => {
                this.eraBackground = option;
              }
            })
            .margin({ right: AppTheme.SpacingSM, bottom: AppTheme.SpacingSM })
          })
        }
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .margin({ bottom: AppTheme.SpacingLG })
      
      // 季节情况
      Column() {
        Text('季节情况')
          .fontSize(AppTheme.FontSizeCaption)
          .fontColor(AppTheme.TextSecondary)
          .margin({ bottom: AppTheme.SpacingSM })
        
        Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
          ForEach(this.seasonOptions, (option: string) => {
            Tag({
              text: option,
              selected: this.season === option,
              onPress: () => {
                this.season = option;
              }
            })
            .margin({ right: AppTheme.SpacingSM, bottom: AppTheme.SpacingSM })
          })
        }
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .margin({ bottom: AppTheme.SpacingXL })
      
      // 确认按钮
      PrimaryButton({
        text: '确认并开始',
        disabled: !this.worldName || !this.eraBackground || !this.season,
        onPress: () => {
          const setting: WorldSetting = {
            worldName: this.worldName,
            eraBackground: this.eraBackground,
            season: this.season
          };
          router.pushUrl({
            url: 'pages/NovelWriting',
            params: setting
          });
        }
      })
    }
    .width('100%')
    .padding(AppTheme.SpacingLG)
  }
}
