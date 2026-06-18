export type FeatureName =
  | 'LIP_LOWER'
  | 'LIP_UPPER'
  | 'EYEBROW_LEFT'
  | 'EYEBROW_RIGHT'
  | 'EYELINER_LEFT'
  | 'EYELINER_RIGHT'
  | 'EYESHADOW_LEFT'
  | 'EYESHADOW_RIGHT'
  | 'FOUNDATION'
  | 'BLUSH_LEFT'
  | 'BLUSH_RIGHT'
  | 'MASCARA_LEFT'
  | 'MASCARA_RIGHT';

export type FeatureConfig = {
  name: FeatureName;
  indices: number[];
  color: string;
  alpha: number;
};

export type FeatureGroupKey =
  | 'LIPS'
  | 'EYEBROWS'
  | 'EYELINER'
  | 'EYESHADOW'
  | 'FOUNDATION'
  | 'BLUSH'
  | 'MASCARA'

export type FeatureGroup = {
  key: FeatureGroupKey
  label: string
  featureNames: FeatureName[]
};

export const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    name: 'LIP_LOWER',
    indices: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 402, 317, 14, 87, 178, 88, 95, 78, 61],
    color: '255,0,0',
    alpha: 0.55,
  },
  {
    name: 'LIP_UPPER',
    indices: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 312, 13, 82, 81, 80, 191, 78],
    color: '255,0,0',
    alpha: 0.55,
  },
  {
    name: 'EYEBROW_LEFT',
    indices: [55, 107, 66, 105, 63, 70, 46, 53, 52, 65, 55],
    color: '139,69,19',
    alpha: 0.45,
  },
  {
    name: 'EYEBROW_RIGHT',
    indices: [285, 336, 296, 334, 293, 300, 276, 283, 295, 285],
    color: '139,69,19',
    alpha: 0.45,
  },
  {
    name: 'EYELINER_LEFT',
    indices: [133, 173, 157, 158, 159, 160, 161, 246, 33],
    color: '15,15,15',
    alpha: 0.9,
  },
  {
    name: 'EYELINER_RIGHT',
    indices: [362, 398, 384, 385, 386, 387, 388, 466, 263],
    color: '15,15,15',
    alpha: 0.9,
  },
  {
    name: 'EYESHADOW_LEFT',
    indices: [226, 247, 30, 29, 27, 28, 56, 190, 243, 173, 157, 158, 159, 160, 161, 246, 33, 130, 226],
    color: '0,100,0',
    alpha: 0.25,
  },
  {
    name: 'EYESHADOW_RIGHT',
    indices: [463, 414, 286, 258, 257, 259, 260, 467, 446, 359, 263, 466, 388, 387, 386, 385, 384, 398, 362, 463],
    color: '0,100,0',
    alpha: 0.25,
  },
  {
    name: 'FOUNDATION',
    indices: [10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10],
    color: '255,224,189',
    alpha: 0.2,
  },
  {
    name: 'BLUSH_LEFT',
    indices: [205, 187, 147, 123, 116, 117, 118, 50, 101, 205],
    color: '255,105,180',
    alpha: 0.25,
  },
  {
    name: 'BLUSH_RIGHT',
    indices: [425, 411, 376, 352, 345, 346, 347, 280, 330, 425],
    color: '255,105,180',
    alpha: 0.25,
  },
  {
    name: 'MASCARA_LEFT',
    // Upper eyelash line landmarks for left eye - from inner to outer corner
    indices: [133, 173, 157, 158, 159, 160, 161, 246, 33, 130],
    color: '20,20,20',
    alpha: 0.85,
  },
  {
    name: 'MASCARA_RIGHT',
    // Upper eyelash line landmarks for right eye - from inner to outer corner
    indices: [362, 398, 384, 385, 386, 387, 388, 466, 263, 359],
    color: '20,20,20',
    alpha: 0.85,
  },
];

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    key: 'LIPS',
    label: 'Môi',
    featureNames: ['LIP_LOWER', 'LIP_UPPER'],
  },
  {
    key: 'EYEBROWS',
    label: 'Lông mày',
    featureNames: ['EYEBROW_LEFT', 'EYEBROW_RIGHT'],
  },
  {
    key: 'EYELINER',
    label: 'Kẻ mắt',
    featureNames: ['EYELINER_LEFT', 'EYELINER_RIGHT'],
  },
  {
    key: 'EYESHADOW',
    label: 'Phấn mắt',
    featureNames: ['EYESHADOW_LEFT', 'EYESHADOW_RIGHT'],
  },
  {
    key: 'FOUNDATION',
    label: 'Phấn nền',
    featureNames: ['FOUNDATION'],
  },
  {
    key: 'BLUSH',
    label: 'Má hồng',
    featureNames: ['BLUSH_LEFT', 'BLUSH_RIGHT'],
  },
  {
    key: 'MASCARA',
    label: 'Mascara',
    featureNames: ['MASCARA_LEFT', 'MASCARA_RIGHT'],
  },
];

// Skin tone types
export type SkinToneType = 'fair' | 'light' | 'medium' | 'tan' | 'dark' | 'deep'
export type FaceShapeType = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong'
export type LipShapeType = 'full' | 'thin' | 'wide' | 'heart' | 'round' | 'downturned'

export const SKIN_TONES: Record<SkinToneType, { label: string; hexColor: string }> = {
  fair: { label: 'Da sáng', hexColor: '#FFE4C4' },
  light: { label: 'Da trắng hồng', hexColor: '#F5DEB3' },
  medium: { label: 'Da vàng trung', hexColor: '#DEB887' },
  tan: { label: 'Da ngăm', hexColor: '#D2A679' },
  dark: { label: 'Da nâu', hexColor: '#8B6914' },
  deep: { label: 'Da nâu đậm', hexColor: '#5C4033' },
}

export const FACE_SHAPES: Record<FaceShapeType, { label: string; description: string }> = {
  oval: { label: 'Oval', description: 'Khuôn mặt cân đối, hài hòa' },
  round: { label: 'Tròn', description: 'Khuôn mặt mềm mại, đầy đặn' },
  square: { label: 'Vuông', description: 'Khuôn mặt góc cạnh, mạnh mẽ' },
  heart: { label: 'Tim', description: 'Trán rộng, cằm nhọn' },
  diamond: { label: 'Kim cương', description: 'Gò má nổi bật' },
  oblong: { label: 'Dài', description: 'Khuôn mặt thanh thoát' },
}

export const LIP_SHAPES: Record<LipShapeType, { label: string; description: string }> = {
  full: { label: 'Đầy đặn', description: 'Môi đầy, quyến rũ' },
  thin: { label: 'Mỏng', description: 'Môi thanh mảnh' },
  wide: { label: 'Rộng', description: 'Môi rộng, nở nụ cười đẹp' },
  heart: { label: 'Hình tim', description: 'Cung môi trên nổi bật' },
  round: { label: 'Tròn', description: 'Môi cân đối' },
  downturned: { label: 'Cong xuống', description: 'Khóe môi hướng xuống' },
}

// Face analysis landmark indices
export const FACE_ANALYSIS_INDICES = {
  // For skin tone analysis - sample from cheeks
  cheekSampleIndices: [205, 425, 187, 411, 147, 376, 123, 352],
  
  // For face shape analysis
  foreheadLeft: 21,
  foreheadRight: 251,
  foreheadTop: 10,
  cheekboneLeft: 205,
  cheekboneRight: 425,
  jawLeft: 135,
  jawRight: 364,
  chinBottom: 152,
  
  // For lip shape analysis
  lipUpperCenter: 13,
  lipLowerCenter: 14,
  lipLeft: 61,
  lipRight: 291,
  lipUpperPeakLeft: 37,
  lipUpperPeakRight: 267,
  lipUpperTop: 0,
  lipLowerBottom: 17,
}
