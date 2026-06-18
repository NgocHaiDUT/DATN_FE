"use client";

import type { FC } from "react";
import AIStudioMakeup from "./AIStudioMakeup";

interface AIStudioProps {
  productData?: any;
}

export const AIStudio: FC<AIStudioProps> = () => {
  return <AIStudioMakeup />;
};

