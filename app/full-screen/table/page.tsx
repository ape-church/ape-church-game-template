import TableKitPage from "@/components/my-full-screen-game/table-kit-reference/TableKitPage";
import MockSiteShell from "@/components/shared/immersive/MockSiteShell";
import "@/components/shared/immersive/immersive.css";

/** Table kit reference: a custom console built from the kit's pieces (docs/FULL-SCREEN.md section 6). */
export const metadata = { title: "Table kit reference" };

export default function TableKitReferencePage() {
    return (
        <MockSiteShell>
            <TableKitPage />
        </MockSiteShell>
    );
}
