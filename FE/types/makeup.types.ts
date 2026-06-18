export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "lipstick" | "eyeshadow" | "blush" | "eyeliner" | "foundation";
  color: string;
  image: string;
  price?: number;
}

export interface FaceLandmarks {
  lips?: any;
  leftEye?: any;
  rightEye?: any;
  leftCheek?: any;
  rightCheek?: any;
}

export interface MakeupState {
  lipstick?: Product;
  eyeshadow?: Product;
  blush?: Product;
  eyeliner?: Product;
  foundation?: Product;
}

export interface MakeupSettings {
  lipstickOpacity: number;
  eyeshadowOpacity: number;
  blushOpacity: number;
  eyelinerOpacity: number;
  foundationOpacity: number;
}
