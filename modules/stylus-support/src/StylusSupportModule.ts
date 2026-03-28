import { NativeModule, requireNativeModule } from 'expo';

declare class StylusSupportModule extends NativeModule {
  hasStylusSupport(): boolean;
}

export default requireNativeModule<StylusSupportModule>('StylusSupport');
