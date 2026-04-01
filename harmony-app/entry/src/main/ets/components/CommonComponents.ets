/**
 * 公共样式常量 - 杂志风格
 */
export class AppTheme {
  // 主色调 - 克莱因蓝
  static readonly Primary = '#002FA7';
  static readonly PrimaryLight = '#4D6FFF';
  
  // 辅助色 - 香槟金
  static readonly Accent = '#C9A96E';
  
  // 背景色
  static readonly Background = '#FFFFFF';
  static readonly BackgroundSecondary = '#F8F9FA';
  static readonly BackgroundCard = '#FFFFFF';
  
  // 文字色
  static readonly TextPrimary = '#1A1A1A';
  static readonly TextSecondary = '#4A4A4A';
  static readonly TextMuted = '#8A8A8A';
  static readonly TextOnPrimary = '#FFFFFF';
  
  // 编辑红（杂志风）
  static readonly EditorialRed = '#C8102E';
  
  // 边框
  static readonly Border = '#E5E5E5';
  static readonly BorderLight = '#F0F0F0';
  
  // 尺寸
  static readonly BorderRadius = 12;
  static readonly BorderRadiusSmall = 8;
  static readonly SpacingXS = 4;
  static readonly SpacingSM = 8;
  static readonly SpacingMD = 16;
  static readonly SpacingLG = 24;
  static readonly SpacingXL = 32;
  
  // 字体大小
  static readonly FontSizeTitle = 32;
  static readonly FontSizeSubtitle = 20;
  static readonly FontSizeBody = 16;
  static readonly FontSizeCaption = 14;
  static readonly FontSizeSmall = 12;
}

/**
 * 通用按钮组件
 */
@Component
export struct PrimaryButton {
  @Prop text: string = '';
  @Prop width: string | number = '100%';
  @Prop height: number = 50;
  @Prop disabled: boolean = false;
  private onPress?: () => void;

  build() {
    Button(this.text)
      .width(this.width)
      .height(this.height)
      .backgroundColor(this.disabled ? AppTheme.TextMuted : AppTheme.Primary)
      .borderRadius(AppTheme.BorderRadius)
      .fontColor(AppTheme.TextOnPrimary)
      .fontSize(AppTheme.FontSizeBody)
      .fontWeight(FontWeight.Medium)
      .enabled(!this.disabled)
      .onClick(() => {
        if (this.onPress) {
          this.onPress();
        }
      })
  }
}

/**
 * 卡片容器组件
 */
@Component
export struct Card {
  @BuilderParam content: () => void;
  @Prop padding: number = AppTheme.SpacingMD;

  build() {
    Column() {
      this.content()
    }
    .width('100%')
    .backgroundColor(AppTheme.BackgroundCard)
    .borderRadius(AppTheme.BorderRadius)
    .padding(this.padding)
    .shadow({
      radius: 8,
      color: 'rgba(0, 0, 0, 0.06)',
      offsetX: 0,
      offsetY: 2
    })
  }
}

/**
 * 输入框组件
 */
@Component
export struct InputField {
  @Link value: string;
  @Prop placeholder: string = '';
  @Prop label: string = '';
  @Prop multiline: boolean = false;
  @Prop height: number = 48;

  build() {
    Column() {
      if (this.label) {
        Text(this.label)
          .fontSize(AppTheme.FontSizeCaption)
          .fontColor(AppTheme.TextSecondary)
          .margin({ bottom: AppTheme.SpacingXS })
      }
      
      TextInput({ text: this.value, placeholder: this.placeholder })
        .width('100%')
        .height(this.height)
        .backgroundColor(AppTheme.BackgroundSecondary)
        .borderRadius(AppTheme.BorderRadiusSmall)
        .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD })
        .fontSize(AppTheme.FontSizeBody)
        .fontColor(AppTheme.TextPrimary)
        .onChange((value) => {
          this.value = value;
        })
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}

/**
 * 标签组件
 */
@Component
export struct Tag {
  @Prop text: string = '';
  @Prop selected: boolean = false;
  private onPress?: () => void;

  build() {
    Text(this.text)
      .padding({ left: AppTheme.SpacingMD, right: AppTheme.SpacingMD, top: AppTheme.SpacingSM, bottom: AppTheme.SpacingSM })
      .backgroundColor(this.selected ? AppTheme.Primary : AppTheme.BackgroundSecondary)
      .borderRadius(20)
      .fontColor(this.selected ? AppTheme.TextOnPrimary : AppTheme.TextSecondary)
      .fontSize(AppTheme.FontSizeCaption)
      .onClick(() => {
        if (this.onPress) {
          this.onPress();
        }
      })
  }
}

/**
 * 加载指示器
 */
@Component
export struct LoadingSpinner {
  @Prop size: number = 40;
  @Prop color: string = AppTheme.Primary;

  build() {
    LoadingProgress()
      .width(this.size)
      .height(this.size)
      .color(this.color)
  }
}
