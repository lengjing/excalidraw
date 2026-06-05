/**
 * Wisp App - routes between workspace home and workspace view.
 */

import { useRouter } from "./router";
import { WorkspaceHome } from "./components/WorkspaceHome";
import { WorkspaceView } from "./components/WorkspaceView";

export function App() {
  const route = useRouter();

  if (route.type === "workspace" && route.workspaceId) {
    return (
      <WorkspaceView
        key={route.workspaceId}
        workspaceId={route.workspaceId}
        activeTab={route.tab || "canvas"}
      />
    );
  }

  return <WorkspaceHome />;
}
