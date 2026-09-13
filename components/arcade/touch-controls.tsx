"use client";

type Props = {
  onDir: (key: string, down: boolean) => void;
  onAction: (which: "e" | "b") => void;
};

export function TouchControls({ onDir, onAction }: Props) {
  const hold = (key: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onDir(key, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onDir(key, false);
    },
    onPointerLeave: () => onDir(key, false),
  });

  return (
    <div className="arcade-touch">
      <div className="dpad">
        <button type="button" className="n" {...hold("w")}>
          ▲
        </button>
        <button type="button" className="w" {...hold("a")}>
          ◀
        </button>
        <button type="button" className="e" {...hold("d")}>
          ▶
        </button>
        <button type="button" className="s" {...hold("s")}>
          ▼
        </button>
      </div>
      <div className="actions">
        <button type="button" onClick={() => onAction("e")}>
          E
        </button>
        <button type="button" className="b" onClick={() => onAction("b")}>
          B
        </button>
      </div>
    </div>
  );
}
