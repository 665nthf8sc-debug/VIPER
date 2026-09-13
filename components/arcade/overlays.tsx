"use client";

/* eslint-disable @next/next/no-img-element */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { arcadeAsset, arcadeBasePath } from "@/lib/arcade/asset";
import {
  ARCADE_SKINS,
  DAILIES,
  EMOTE_PRICES,
  PET_PORTRAITS,
  PET_PRICES,
  THEMES,
  type ThemeId,
} from "@/lib/arcade/catalog";
import {
  addFriend,
  buyEmote,
  buyPet,
  buySkin,
  canUseSkin,
  currentSave,
  equipArcadeSkin,
  exportSaveCode,
  importSaveCode,
  loginAccount,
  logoutAccount,
  mostPlayed,
  patchSettings,
  playAsGuest,
  playerCountEstimate,
  redeemCode,
  registerAccount,
  setTheme,
  type ArcadeSave,
} from "@/lib/arcade/save";
import { EMOTES } from "@/lib/pass";
import { sfx } from "@/lib/sfx";
import { useEffect, useState } from "react";

function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="arcade-modal" role="dialog">
      <div className="arcade-panel">
        <header>
          <h2>{title}</h2>
          <Button variant="arcade" className="h-9 px-3" onClick={onClose}>
            CLOSE
          </Button>
        </header>
        <div className="arcade-panel-body">{children}</div>
      </div>
    </div>
  );
}

export function AccountGate({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("");

  return (
    <Panel title="VIPER3384 ARCADE" onClose={onDone}>
      <p className="lede">Sign in to keep skins, tickets, and scores. Guest works too.</p>
      <div className="grid-form">
        <Input
          value={name}
          maxLength={16}
          placeholder="USERNAME"
          onChange={(e) => setName(e.target.value.toUpperCase())}
        />
        <Input
          type="password"
          value={pass}
          placeholder="PASSWORD"
          onChange={(e) => setPass(e.target.value)}
        />
      </div>
      <div className="row">
        <Button
          variant="pixel"
          className="h-11"
          onClick={async () => {
            const r = await registerAccount(name, pass);
            setMsg(r.ok ? "ACCOUNT SAVED" : r.label);
            if (r.ok) {
              sfx.xp();
              onDone();
            } else sfx.hit();
          }}
        >
          REGISTER
        </Button>
        <Button
          variant="arcade"
          className="h-11"
          onClick={async () => {
            const r = await loginAccount(name, pass);
            setMsg(r.ok ? "WELCOME BACK" : r.label);
            if (r.ok) {
              sfx.coin();
              onDone();
            } else sfx.hit();
          }}
        >
          LOGIN
        </Button>
        <Button
          variant="arcade"
          className="h-11"
          onClick={() => {
            playAsGuest();
            sfx.select();
            onDone();
          }}
        >
          GUEST
        </Button>
      </div>
      <p className="lede">Import save code</p>
      <Input value={code} placeholder="VIPER3384...." onChange={(e) => setCode(e.target.value)} />
      <Button
        variant="arcade"
        className="mt-2 h-10"
        onClick={async () => {
          const r = await importSaveCode(code);
          setMsg(r.ok ? "SAVE LOADED" : r.label);
          if (r.ok) onDone();
        }}
      >
        IMPORT
      </Button>
      {msg ? <p className="toast-inline">{msg}</p> : null}
    </Panel>
  );
}

export function KeypadModal({
  onClose,
  onCutscene,
}: {
  onClose: () => void;
  onCutscene: () => void;
}) {
  const [digits, setDigits] = useState("");
  const [msg, setMsg] = useState("ENTER CODE");
  const press = (ch: string) => {
    sfx.select();
    if (ch === "CLR") {
      setDigits("");
      return;
    }
    if (ch === "OK") {
      const r = redeemCode(digits);
      setMsg(r.label);
      if (r.ok) sfx.xp();
      else sfx.hit();
      if (r.ok && r.kind === "cutscene") onCutscene();
      setDigits("");
      return;
    }
    setDigits((d) => (d + ch).slice(0, 10));
  };
  return (
    <Panel title="WALL KEYPAD" onClose={onClose}>
      <div className="keypad-readout">{digits || msg}</div>
      <div className="numpad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "OK"].map((ch) => (
          <button key={ch} type="button" onClick={() => press(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <p className="lede">Try BANK, GRIND, SUNSET, STEEL, or 3384.</p>
    </Panel>
  );
}

export function SkinsModal({ save, onClose }: { save: ArcadeSave; onClose: () => void }) {
  return (
    <Panel title="SKIN SELECTOR" onClose={onClose}>
      <div className="skin-grid">
        {ARCADE_SKINS.map((skin) => {
          const owned = canUseSkin(skin.id, save);
          const on = save.pass.equipped === skin.id;
          return (
            <button
              key={skin.id}
              type="button"
              className={on ? "on" : ""}
              onClick={() => {
                if (owned && equipArcadeSkin(skin.id)) sfx.select();
                else sfx.hit();
              }}
            >
              <img src={arcadeAsset(skin.portrait)} alt="" />
              <strong>{skin.name}</strong>
              <span>{owned ? skin.blurb : "LOCKED"}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function PrizeModal({ save, onClose }: { save: ArcadeSave; onClose: () => void }) {
  const daily = DAILIES.find((d) => d.id === save.daily.id);
  return (
    <Panel title="PRIZE COUNTER" onClose={onClose}>
      <p className="lede">
        XP {save.pass.xp}/15000 · TICKETS {save.tickets}/∞
      </p>
      {daily ? (
        <p className="daily">
          DAILY: {daily.label} — {save.daily.done ? "CLAIMED" : `${daily.tickets} TIX`}
        </p>
      ) : null}
      <div className="skin-grid compact">
        {ARCADE_SKINS.filter((s) => s.id !== "fox").map((skin) => (
          <button
            key={skin.id}
            type="button"
            onClick={() => {
              const r = buySkin(skin.id);
              if (r.ok) sfx.coin();
              else sfx.hit();
            }}
          >
            <img src={arcadeAsset(skin.portrait)} alt="" />
            <strong>{skin.name}</strong>
            <span>{canUseSkin(skin.id, save) ? "OWNED" : `${skin.tickets} TIX`}</span>
          </button>
        ))}
      </div>
      <div className="row wrap">
        {(Object.keys(PET_PRICES) as Array<keyof typeof PET_PRICES>).map((id) => (
          <Button
            key={id}
            variant="arcade"
            className="h-10"
            onClick={() => {
              const r = buyPet(id, PET_PRICES[id]);
              if (r.ok) sfx.llama();
              else sfx.hit();
            }}
          >
            {id.toUpperCase()} {PET_PRICES[id]} TIX
          </Button>
        ))}
        {EMOTES.map((e) =>
          EMOTE_PRICES[e.id] ? (
            <Button
              key={e.id}
              variant="arcade"
              className="h-10"
              onClick={() => {
                const r = buyEmote(e.id, EMOTE_PRICES[e.id]!);
                if (r.ok) sfx.emote();
                else sfx.hit();
              }}
            >
              {e.name} {EMOTE_PRICES[e.id]} TIX
            </Button>
          ) : null
        )}
      </div>
    </Panel>
  );
}

export function SettingsModal({ save, onClose }: { save: ArcadeSave; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Panel title="SETTINGS" onClose={onClose}>
      <div className="row wrap">
        <Button
          variant={save.settings.music ? "pixel" : "arcade"}
          className="h-10"
          onClick={() => {
            patchSettings({ music: !save.settings.music });
            sfx.setMuted(!save.settings.sfx && save.settings.music);
            if (save.settings.music) sfx.stopFpsMusic();
            else sfx.playFpsMusic("title");
          }}
        >
          MUSIC {save.settings.music ? "ON" : "OFF"}
        </Button>
        <Button
          variant={save.settings.sfx ? "pixel" : "arcade"}
          className="h-10"
          onClick={() => {
            const next = !save.settings.sfx;
            patchSettings({ sfx: next });
            sfx.setMuted(!next);
          }}
        >
          SFX {save.settings.sfx ? "ON" : "OFF"}
        </Button>
        <Button
          variant="arcade"
          className="h-10"
          onClick={() =>
            patchSettings({ quality: save.settings.quality === "high" ? "low" : "high" })
          }
        >
          GFX {save.settings.quality.toUpperCase()}
        </Button>
      </div>
      <p className="lede">Personal lighting (only you see it)</p>
      <div className="row wrap">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => (
          <Button
            key={id}
            variant={save.theme === id ? "pixel" : "arcade"}
            className="h-10"
            onClick={() => setTheme(id)}
          >
            {THEMES[id].name}
          </Button>
        ))}
      </div>
      <p className="lede">Save code — paste on another device</p>
      <textarea readOnly value={exportSaveCode()} className="save-code" />
      <div className="row">
        <Button
          variant="arcade"
          className="h-10"
          onClick={async () => {
            await navigator.clipboard?.writeText(exportSaveCode());
            setCopied(true);
          }}
        >
          {copied ? "COPIED" : "COPY CODE"}
        </Button>
        <Button variant="arcade" className="h-10" onClick={() => logoutAccount()}>
          LOG OUT
        </Button>
      </div>
    </Panel>
  );
}

export function FriendsModal({ save, onClose }: { save: ArcadeSave; onClose: () => void }) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const make = () => {
    const payload = btoa(
      unescape(
        encodeURIComponent(
          JSON.stringify({
            u: save.username,
            s: save.pass.equipped,
            t: save.theme,
            p: save.pass.sidekick,
          })
        )
      )
    );
    const url = `${window.location.origin}${arcadeBasePath()}/?visit=${encodeURIComponent(payload)}`;
    setLink(url);
    void navigator.clipboard?.writeText(url);
    sfx.coin();
  };
  return (
    <Panel title="FRIENDS" onClose={onClose}>
      <p className="lede">
        Online here: you{save.friends.length ? ` + ${save.friends.join(", ")}` : ""}.
      </p>
      <Button variant="pixel" className="h-11" onClick={make}>
        GENERATE INVITE LINK
      </Button>
      {link ? <textarea readOnly className="save-code" value={link} /> : null}
      <div className="row">
        <Input
          value={name}
          placeholder="ADD FRIEND NAME"
          onChange={(e) => setName(e.target.value.toUpperCase())}
        />
        <Button
          variant="arcade"
          className="h-10"
          onClick={() => {
            if (addFriend(name)) sfx.select();
            else sfx.hit();
          }}
        >
          ADD
        </Button>
      </div>
      <p className="lede">
        Visiting a friend loads their equipped skin as an NPC. Scores still save to your account.
        Squad Up opens VIPER DROP.
      </p>
    </Panel>
  );
}

export function SoonModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <Panel title={`${title} · UNDER CONSTRUCTION`} onClose={onClose}>
      <p className="lede">Build Progress: 0%</p>
      <p className="lede">Estimated drop: Season 2 — keep grinding tickets.</p>
    </Panel>
  );
}

export function DebugModal({ save, onClose }: { save: ArcadeSave; onClose: () => void }) {
  return (
    <Panel title="DEBUG STATS" onClose={onClose}>
      <p className="lede">Players in the metaverse (est.): {playerCountEstimate()}</p>
      <p className="lede">Most played cabinet: {mostPlayed(save).toUpperCase()}</p>
      <p className="lede">
        Revenue: ${((save.tickets * 0.03) | 0).toFixed(2)} in arcade tickets (not dollars).
      </p>
      <ul className="stats">
        {Object.entries(save.plays).map(([g, n]) => (
          <li key={g}>
            {g}: {n} plays · HS {save.highScores[g] ?? 0}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function InsertCoin({
  title,
  onPlay,
  onClose,
}: {
  title: string;
  onPlay: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    sfx.coin();
  }, []);
  return (
    <Panel title={title} onClose={onClose}>
      <p className="lede">CRT warming up. Insert coin to jack in.</p>
      <Button
        variant="pixel"
        className="h-12 w-full"
        onClick={() => {
          sfx.start();
          onPlay();
        }}
      >
        INSERT COIN
      </Button>
    </Panel>
  );
}

export function HudBar({
  save,
  prompt,
  visitor,
}: {
  save: ArcadeSave;
  prompt: string | null;
  visitor: string | null;
}) {
  const pet =
    save.pass.sidekick !== "none"
      ? arcadeAsset(PET_PORTRAITS[save.pass.sidekick as keyof typeof PET_PORTRAITS])
      : null;
  return (
    <div className="arcade-hud">
      <div className="hud-left">
        <strong>{save.username}</strong>
        <span>XP {save.pass.xp}</span>
        <span>TIX {save.tickets}</span>
        {pet ? <img src={pet} alt="" /> : null}
      </div>
      <div className="hud-mid">{prompt ?? "WASD WALK · E INTERACT · B DANCE"}</div>
      <div className="hud-right">
        {visitor ? <span>VISITING {visitor}</span> : <span>VIPER3384 ARCADE</span>}
      </div>
    </div>
  );
}

export function useArcadeSave() {
  const [save, setSave] = useState<ArcadeSave>(() => currentSave());
  useEffect(() => {
    const sync = () => setSave(currentSave());
    sync();
    window.addEventListener("viper-arcade", sync);
    window.addEventListener("viper-pass", sync);
    return () => {
      window.removeEventListener("viper-arcade", sync);
      window.removeEventListener("viper-pass", sync);
    };
  }, []);
  return save;
}
