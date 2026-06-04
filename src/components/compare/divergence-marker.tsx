import type { PairKind } from '../../types/compare';

export function DivergenceMarker({
  seq,
  kind,
  side,
}: {
  seq: number;
  kind: PairKind;
  side: 'a' | 'b';
}) {
  return (
    <div
      id={`first-divergence-marker-${side}`}
      className="bg-divergence-marker text-background sticky top-0 z-10 my-2 rounded-md px-3 py-1.5 text-center text-xs font-medium"
    >
      first divergence at #{seq} — {kind}
    </div>
  );
}
