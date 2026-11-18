import { Suspense } from "react";
import { myFullScreenGame } from "@/components/my-full-screen-game/myFullScreenGameConfig";
import MyFullScreenGame from "@/components/my-full-screen-game/MyFullScreenGame";
import MockSiteShell from "@/components/shared/immersive/MockSiteShell";
// Global shell rules for the full-screen frame. They only apply while the frame is on the page (see the file).
import "@/components/shared/immersive/immersive.css";

/**
 * The full-screen example (docs/FULL-SCREEN.md). DO NOT EDIT: build your game in components/my-full-screen-game.
 * MockSiteShell stands in for ape.church's top nav + sidebar so the frame behaves here as it will on the site.
 */
export async function generateMetadata() {
    return {
        title: myFullScreenGame.title,
        description: myFullScreenGame.description,
    };
}

export default function MyFullScreenGamePage() {
    return (
        <MockSiteShell>
            {/* Suspense is required: the game reads the ?id= replay param with useSearchParams(). */}
            <Suspense fallback={null}>
                <MyFullScreenGame game={myFullScreenGame} />
            </Suspense>
        </MockSiteShell>
    );
}
