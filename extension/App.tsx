/**
 * Extension App - routes between board home and board editor.
 */

import { useRouter } from "./router";
import { BoardHome } from "./components/BoardHome";
import { BoardView } from "./components/BoardView";

export function App() {
  const route = useRouter();

  if (route.type === "board" && route.boardId) {
    return <BoardView key={route.boardId} boardId={route.boardId} />;
  }

  return <BoardHome />;
}
