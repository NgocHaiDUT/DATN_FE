// Mock products for makeup AR testing
import { Product } from "@/types/makeup.types";

export const mockProducts: Product[] = [
  // Lipsticks
  {
    id: "lip-1",
    name: "Velvet Matte Red",
    brand: "Luxury Beauty",
    category: "lipstick",
    color: "#DC143C",
    image: "/makeup/lipstick-red.jpg",
    price: 25.99,
  },
  {
    id: "lip-2",
    name: "Pink Perfection",
    brand: "Luxury Beauty",
    category: "lipstick",
    color: "#FF69B4",
    image: "/makeup/lipstick-pink.jpg",
    price: 22.99,
  },
  {
    id: "lip-3",
    name: "Nude Elegance",
    brand: "Luxury Beauty",
    category: "lipstick",
    color: "#E8B5A8",
    image: "/makeup/lipstick-nude.jpg",
    price: 24.99,
  },
  {
    id: "lip-4",
    name: "Berry Bliss",
    brand: "Luxury Beauty",
    category: "lipstick",
    color: "#8B1A3D",
    image: "/makeup/lipstick-berry.jpg",
    price: 23.99,
  },
  
  // Eyeshadows
  {
    id: "eye-1",
    name: "Golden Shimmer",
    brand: "Glam Eyes",
    category: "eyeshadow",
    color: "#FFD700",
    image: "/makeup/eyeshadow-gold.jpg",
    price: 18.99,
  },
  {
    id: "eye-2",
    name: "Brown Sugar",
    brand: "Glam Eyes",
    category: "eyeshadow",
    color: "#8B4513",
    image: "/makeup/eyeshadow-brown.jpg",
    price: 16.99,
  },
  {
    id: "eye-3",
    name: "Purple Dream",
    brand: "Glam Eyes",
    category: "eyeshadow",
    color: "#9370DB",
    image: "/makeup/eyeshadow-purple.jpg",
    price: 19.99,
  },
  
  // Blush
  {
    id: "blush-1",
    name: "Peachy Glow",
    brand: "Radiance",
    category: "blush",
    color: "#FFDAB9",
    image: "/makeup/blush-peach.jpg",
    price: 15.99,
  },
  {
    id: "blush-2",
    name: "Rose Petal",
    brand: "Radiance",
    category: "blush",
    color: "#FFB6C1",
    image: "/makeup/blush-rose.jpg",
    price: 14.99,
  },
  {
    id: "blush-3",
    name: "Coral Crush",
    brand: "Radiance",
    category: "blush",
    color: "#FF7F50",
    image: "/makeup/blush-coral.jpg",
    price: 16.99,
  },
];

export const getProductsByCategory = (category: Product["category"]): Product[] => {
  return mockProducts.filter((p) => p.category === category);
};
