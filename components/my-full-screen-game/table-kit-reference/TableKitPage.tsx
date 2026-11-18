"use client";

import ImmersiveGameFrame from "@/components/shared/immersive/ImmersiveGameFrame";
import { useImmersiveFrameControls } from "@/components/shared/immersive/frameControls";
import TableKitExample from "./TableKitExample";

/** The table reference in the full-screen frame (no history below, so no HISTORY pill). */
export default function TableKitPage() {
    const frame = useImmersiveFrameControls(true, { history: false });
    return (
        <ImmersiveGameFrame maxAspect={2.4}>
            <TableKitExample frame={frame} />
        </ImmersiveGameFrame>
    );
}
