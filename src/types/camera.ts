import {
  CompositionRule,
  ImageAspectRatio,
  LensType,
  LightingStyle,
  MotionBlurEffect,
  ShotAngle,
  CameraPerspective,
} from "./enums";

/** Camera parameters used by Frames and/or generation requests. */
export interface CameraParameters {
  angle?: ShotAngle;
  perspective?: CameraPerspective;
  composition?: CompositionRule;
  aspectRatio?: ImageAspectRatio;
  lensType?: LensType;
  motionBlurEffect?: MotionBlurEffect;
  lightingStyle?: LightingStyle;
}
