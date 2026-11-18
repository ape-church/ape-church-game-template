"use client";

import { createContext, useContext } from "react";

/**
 * True inside an immersive frame's stage (ImmersiveGameFrame provides it).
 * Shared controls use it to keep the frame's conventions, e.g. GpModePill
 * warns there: GP belongs on the console's balance readout (kit/GpSwitch.tsx).
 */
export const ImmersiveStageContext = createContext(false);

export const useInImmersiveStage = () => useContext(ImmersiveStageContext);
