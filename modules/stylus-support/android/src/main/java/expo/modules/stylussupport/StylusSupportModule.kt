package expo.modules.stylussupport

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StylusSupportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StylusSupport")

    Function("hasStylusSupport") {
      val context = appContext.reactContext ?: return@Function false
      val pm = context.packageManager
      // 표준 Android 스타일러스 피처
      val standard = pm.hasSystemFeature("android.hardware.touchscreen.stylus")
      // 삼성 S Pen 고유 피처
      val samsung = pm.hasSystemFeature("com.sec.feature.spen_usp")
      standard || samsung
    }
  }
}
