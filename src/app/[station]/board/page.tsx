import { Suspense } from "react";
import BoardView from "@/components/board/BoardView";

async function Board({ params }: { params: Promise<{ station: string }> }) {
  const { station } = await params;
  return <BoardView slug={station} />;
}

export default function BoardPage({ params }: { params: Promise<{ station: string }> }) {
  return (
    <Suspense>
      <Board params={params} />
    </Suspense>
  );
}
