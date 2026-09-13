"use client";

import { ArcadeStage, type OverlayKind } from "@/components/arcade/arcade-stage";
import {
  AccountGate,
  DebugModal,
  FriendsModal,
  HudBar,
  InsertCoin,
  KeypadModal,
  PrizeModal,
  SettingsModal,
  SkinsModal,
  SoonModal,
  useArcadeSave,
} from "@/components/arcade/overlays";
import { TouchControls } from "@/components/arcade/touch-controls";
import { ViperBuilder } from "@/components/games/viper-builder";
import { ViperCrossing } from "@/components/games/viper-crossing";
import { ViperDefender } from "@/components/games/viper-defender";
import { ViperSnake } from "@/components/games/viper-snake";
import { ViperDrop } from "@/components/viper-drop";
import { ViperFps } from "@/components/viper-fps";
import type { GameId } from "@/lib/arcade/catalog";
import {
  isSignedIn,
  lookupPublic,
  playAsGuest,
  redeemCode,
  type PublicProfile,
} from "@/lib/arcade/save";
import { playEmote } from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function readVisitor(): PublicProfile | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const friend = params.get("friend");
  const visit = params.get("visit");
  if (friend) return lookupPublic(friend);
  if (!visit) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(visit)))) as {
      u?: string;
      s?: PublicProfile["equipped"];
      t?: PublicProfile["theme"];
      p?: PublicProfile["sidekick"];
    };
    if (!parsed.u) return null;
    return {
      username: parsed.u,
      equipped: parsed.s ?? "fox",
      theme: parsed.t ?? "sunset",
      sidekick: parsed.p ?? "none",
    };
  } catch {
    return null;
  }
}

export function ArcadeApp() {
  const save = useArcadeSave();
  const keysRef = useRef(new Set<string>());
  const [overlay, setOverlay] = useState<OverlayKind>("account");
  const [game, setGame] = useState<GameId | null>(null);
  const [soon, setSoon] = useState("PINBALL");
  const [insert, setInsert] = useState<{ id: GameId; title: string } | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [dancing, setDancing] = useState(false);
  const [visitor] = useState<PublicProfile | null>(readVisitor);

  useEffect(() => {
    if (!isSignedIn()) playAsGuest();
  }, []);

  useEffect(() => {
    sfx.setMuted(!save.settings.sfx);
    if (overlay === "game") return;
    if (save.settings.music) sfx.playFpsMusic("title");
    else sfx.stopFpsMusic();
  }, [overlay, save.settings.music, save.settings.sfx]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape") {
        if (overlay && overlay !== "cutscene") {
          setOverlay(null);
          setGame(null);
          setInsert(null);
        }
        return;
      }
      if (overlay === "game" || overlay === "keypad" || overlay === "account") return;
      keysRef.current.add(k);
      if (k === "b" && overlay === null) {
        setDancing(true);
        playEmote();
        sfx.emote();
        window.setTimeout(() => setDancing(false), 1800);
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [overlay]);

  const onInteract = useCallback((id: string, kind: string, title: string) => {
    sfx.coin();
    if (kind === "machine" || (kind === "admin" && id === "admin-builder")) {
      const gid = (
        id === "admin-builder" ? "builder" : id
      ) as GameId;
      setInsert({ id: gid, title });
      setOverlay("insert");
      return;
    }
    if (kind === "keypad") {
      setOverlay("keypad");
      return;
    }
    if (id === "home-skins") {
      setOverlay("skins");
      return;
    }
    if (id === "home-settings") {
      setOverlay("settings");
      return;
    }
    if (id === "home-friends") {
      setOverlay("friends");
      return;
    }
    if (kind === "prize") {
      setOverlay("prize");
      return;
    }
    if (kind === "soon") {
      setSoon(title);
      setOverlay("soon");
      return;
    }
    if (id === "admin-debug") {
      setOverlay("debug");
      return;
    }
    if (id === "admin-skin") {
      redeemCode("ADMIN");
      sfx.xp();
      return;
    }
    if (id === "secret-door") {
      setOverlay("keypad");
    }
  }, []);

  const startGame = (id: GameId) => {
    keysRef.current.clear();
    setGame(id);
    setInsert(null);
    setOverlay("game");
    sfx.stopFpsMusic();
  };

  const closeAll = () => {
    setOverlay(null);
    setGame(null);
    setInsert(null);
  };

  const cutscene = () => {
    setOverlay("cutscene");
    sfx.warp();
    window.setTimeout(() => setOverlay(null), 2400);
  };

  const onDir = (key: string, down: boolean) => {
    if (down) keysRef.current.add(key);
    else keysRef.current.delete(key);
  };

  const onTouchAction = (which: "e" | "b") => {
    if (which === "b") {
      setDancing(true);
      playEmote();
      sfx.emote();
      window.setTimeout(() => setDancing(false), 1800);
      return;
    }
    const ev = new KeyboardEvent("keydown", { key: "e" });
    window.dispatchEvent(ev);
  };

  const gameView = useMemo(() => {
    if (overlay !== "game" || !game) return null;
    const exit = closeAll;
    if (game === "drop") return <ViperDrop embedded onExit={exit} />;
    if (game === "fps") return <ViperFps embedded onExit={exit} />;
    if (game === "crossing") return <ViperCrossing onExit={exit} />;
    if (game === "snake") return <ViperSnake onExit={exit} />;
    if (game === "defender") return <ViperDefender onExit={exit} />;
    return <ViperBuilder onExit={exit} />;
  }, [game, overlay]);

  return (
    <div className="arcade-root">
      <ArcadeStage
        theme={save.theme}
        skin={save.pass.equipped}
        pet={save.pass.sidekick}
        secret={save.secretRoom || save.admin}
        overlay={overlay}
        visitor={visitor}
        quality={save.settings.quality}
        dancing={dancing}
        onPrompt={setPrompt}
        onInteract={onInteract}
        keysRef={keysRef}
      />
      <HudBar save={save} prompt={prompt} visitor={visitor?.username ?? null} />
      <TouchControls onDir={onDir} onAction={onTouchAction} />
      {overlay === "account" ? <AccountGate onDone={() => setOverlay(null)} /> : null}
      {overlay === "keypad" ? (
        <KeypadModal onClose={() => setOverlay(null)} onCutscene={cutscene} />
      ) : null}
      {overlay === "skins" ? (
        <SkinsModal save={save} onClose={() => setOverlay(null)} />
      ) : null}
      {overlay === "prize" ? (
        <PrizeModal save={save} onClose={() => setOverlay(null)} />
      ) : null}
      {overlay === "settings" ? (
        <SettingsModal save={save} onClose={() => setOverlay(null)} />
      ) : null}
      {overlay === "friends" ? (
        <FriendsModal save={save} onClose={() => setOverlay(null)} />
      ) : null}
      {overlay === "soon" ? (
        <SoonModal title={soon} onClose={() => setOverlay(null)} />
      ) : null}
      {overlay === "debug" ? (
        <DebugModal save={save} onClose={() => setOverlay(null)} />
      ) : null}
      {overlay === "insert" && insert ? (
        <InsertCoin
          title={insert.title}
          onClose={() => {
            setInsert(null);
            setOverlay(null);
          }}
          onPlay={() => startGame(insert.id)}
        />
      ) : null}
      {overlay === "game" ? <div className="arcade-game-layer">{gameView}</div> : null}
      {overlay === "cutscene" ? (
        <div className="cutscene-veil">
          <p>ACCESS 3384 · WALL SEQUENCE</p>
        </div>
      ) : null}
    </div>
  );
}
