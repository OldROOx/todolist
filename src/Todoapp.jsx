import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "todoapp.tasks";

const defaultTasks = [
    { id: 1, text: "Grabar clip para el canal", done: false },
    { id: 2, text: "Fix del pipeline de Tinta", done: true },
    { id: 3, text: "Ensayar bajo 20 min", done: false },
];

export default function TodoApp() {
    const [tasks, setTasks] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : defaultTasks;
        } catch {
            return defaultTasks;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch {
            // storage no disponible, se ignora
        }
    }, [tasks]);

    const [input, setInput] = useState("");
    const nextId = useRef(tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1);

    /* ---------- sonidos (Web Audio, sin archivos) ---------- */
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(false);
    const audioRef = useRef(null);

    useEffect(() => {
        mutedRef.current = muted;
    }, [muted]);

    const getCtx = () => {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!audioRef.current) audioRef.current = new AC();
        if (audioRef.current.state === "suspended") audioRef.current.resume();
        return audioRef.current;
    };

    // bip con envolvente corta
    const beep = (ctx, { freq, to, type = "square", start = 0, dur = 0.1, vol = 0.07 }) => {
        const t = ctx.currentTime + start;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.03);
    };

    // click seco de relevador (ruido filtrado)
    const clack = (ctx, { start = 0, vol = 0.2, freq = 1800 } = {}) => {
        const t = ctx.currentTime + start;
        const len = Math.floor(ctx.sampleRate * 0.05);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = freq;
        filter.Q.value = 1.2;
        const gain = ctx.createGain();
        gain.gain.value = vol;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t);
    };

    const sfx = {
        // alta: click de tecla + bip que sube
        add: (ctx) => {
            clack(ctx, { vol: 0.16 });
            beep(ctx, { freq: 660, to: 1320, dur: 0.1, vol: 0.06 });
        },
        // completar: arpegio corto ascendente
        done: (ctx) => {
            beep(ctx, { freq: 784, dur: 0.07, vol: 0.055, type: "triangle" });
            beep(ctx, { freq: 1047, start: 0.07, dur: 0.09, vol: 0.055, type: "triangle" });
            beep(ctx, { freq: 1568, start: 0.15, dur: 0.13, vol: 0.045, type: "triangle" });
        },
        // desmarcar: bip que baja
        undone: (ctx) => {
            beep(ctx, { freq: 660, to: 330, dur: 0.12, vol: 0.05, type: "triangle" });
        },
        // borrar: golpe grave tipo apagón
        del: (ctx) => {
            clack(ctx, { vol: 0.18, freq: 600 });
            beep(ctx, { freq: 200, to: 55, dur: 0.22, vol: 0.09, type: "sawtooth" });
        },
    };

    const play = (name) => {
        if (mutedRef.current) return;
        try {
            const ctx = getCtx();
            if (ctx) sfx[name](ctx);
        } catch {
            // audio no disponible, se ignora
        }
    };

    const addTask = () => {
        const text = input.trim();
        if (!text) return;
        setTasks((t) => [{ id: nextId.current++, text, done: false }, ...t]);
        setInput("");
        play("add");
    };

    const toggle = (id) => {
        const task = tasks.find((x) => x.id === id);
        play(task && !task.done ? "done" : "undone");
        setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    };

    const remove = (id) => {
        play("del");
        setTasks((t) => t.filter((x) => x.id !== id));
    };

    const pending = tasks.filter((t) => !t.done).length;
    const doneCount = tasks.length - pending;
    const progress = tasks.length ? (doneCount / tasks.length) * 100 : 0;

    return (
        <div className="td-room">
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=VT323&display=swap');

.td-room {
  --panel:     #23261d;
  --panel-dk:  #121410;
  --edge:      #3a3f2f;
  --engrave:   #8fa070;
  --ink:       #dde7cb;
  --glass:     #070a05;
  --green:     #a3e635;
  --green-lt:  #d6f88a;
  --green-dk:  #5f9226;
  --danger:    #d0604f;

  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  display: flex;
  background: transparent;
  font-family: Archivo, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--ink);
}
.td-room *, .td-room *::before, .td-room *::after { box-sizing: border-box; }

/* ---------- carcasa ---------- */
.td-chassis {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 100vh;
  padding: 34px 20px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    linear-gradient(158deg, #2b2f24 0%, var(--panel) 38%, var(--panel-dk) 100%);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.07),
    inset 0 -3px 0 rgba(0,0,0,.5);
}
/* grano análogo */
.td-chassis::after {
  content: "";
  position: absolute; inset: 0;
  pointer-events: none;
  opacity: .5;
  background-image:
    repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px);
}
.td-inner {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.td-inner .td-foot { margin-top: auto; padding-top: 24px }

.td-screw {
  position: absolute;
  width: 11px; height: 11px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #6a7159, #3a3f2f 65%, #22261c);
  box-shadow: inset 0 -1px 1px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.07);
}
.td-screw::before {
  content: ""; position: absolute; top: 50%; left: 2px; right: 2px;
  height: 1.5px; background: rgba(10,12,8,.85); transform: translateY(-50%) rotate(28deg);
}
.td-screw.tl { top: 14px; left: 14px }
.td-screw.tr { top: 14px; right: 14px }
.td-screw.bl { bottom: 14px; left: 14px }
.td-screw.br { bottom: 14px; right: 14px }

/* ---------- placa superior ---------- */
.td-plate {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 4px 12px;
}
.td-brand {
  font-size: 13px; font-weight: 800; letter-spacing: .34em;
  text-transform: uppercase; color: var(--engrave);
  text-shadow: 0 1px 0 rgba(0,0,0,.7);
}
.td-power { display: flex; align-items: center; gap: 7px; }
.td-lamp {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 9px rgba(163,230,53,.9), inset 0 0 3px rgba(255,255,255,.6);
  animation: td-breathe 3.6s ease-in-out infinite;
}
.td-snd {
  font-family: Archivo, sans-serif;
  font-size: 9px; font-weight: 700; letter-spacing: .2em;
  color: #8fa070; background: transparent;
  border: 1px solid var(--edge); border-radius: 6px;
  padding: 5px 9px; cursor: pointer;
  transition: color .15s ease, border-color .15s ease;
}
.td-snd:hover { color: var(--green); border-color: var(--green-dk) }
.td-snd.off { color: #5f6a4a; opacity: .7 }

/* ---------- display fósforo verde ---------- */
.td-display {
  position: relative;
  border-radius: 12px;
  padding: 16px 18px 14px;
  background:
    radial-gradient(120% 130% at 50% 100%, rgba(163,230,53,.18), transparent 62%),
    linear-gradient(180deg, #10150c, var(--glass));
  border: 1px solid #313726;
  box-shadow:
    inset 0 3px 12px rgba(0,0,0,.95),
    inset 0 0 0 3px rgba(255,255,255,.03),
    0 1px 0 rgba(255,255,255,.05);
  overflow: hidden;
}
.td-display::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 3px);
}
.td-readout {
  display: flex; align-items: baseline; gap: 10px;
  font-family: VT323, "Courier New", monospace;
  color: var(--green);
  text-shadow: 0 0 12px rgba(163,230,53,.7);
}
.td-count { font-size: 60px; line-height: .85; letter-spacing: .02em; }
.td-caption { font-size: 20px; color: var(--green-lt); opacity: .8; }
.td-cursor {
  display: inline-block; width: 11px; height: 22px;
  background: var(--green); margin-left: 2px;
  animation: td-blink 1.05s steps(1) infinite;
}
.td-meter {
  margin-top: 14px; height: 9px; border-radius: 3px;
  background: #060803; border: 1px solid #2c3323; overflow: hidden;
}
.td-meter i {
  display: block; height: 100%;
  background: linear-gradient(90deg, var(--green-dk), var(--green), var(--green-lt));
  box-shadow: 0 0 10px rgba(163,230,53,.8);
  transition: width .45s cubic-bezier(.22,1,.36,1);
}
.td-ticks {
  display: flex; justify-content: space-between; margin-top: 6px;
  font-family: VT323, monospace; font-size: 13px; color: #5f7a33;
}

/* ---------- entrada ---------- */
.td-row { display: flex; gap: 10px; margin: 18px 0 16px; }
.td-input {
  flex: 1; min-width: 0;
  font-family: VT323, "Courier New", monospace;
  font-size: 21px; color: var(--ink);
  caret-color: var(--green);
  padding: 12px 14px;
  border-radius: 9px;
  border: 1px solid var(--edge);
  background: linear-gradient(180deg, #14170f, #1b1f16);
  box-shadow: inset 0 3px 7px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.05);
  outline: none;
}
.td-input::placeholder { color: #6b7554 }
.td-input:focus { border-color: var(--green-dk); box-shadow: inset 0 3px 7px rgba(0,0,0,.7), 0 0 0 3px rgba(163,230,53,.18) }

.td-add {
  flex-shrink: 0; padding: 0 22px;
  font-family: Archivo, sans-serif; font-size: 12px; font-weight: 800;
  letter-spacing: .18em; text-transform: uppercase; color: #16210a;
  border: 1px solid #5f8a1c; border-radius: 9px;
  background: linear-gradient(180deg, var(--green-lt), var(--green) 45%, #7fbb27);
  box-shadow: 0 4px 0 #45690f, inset 0 1px 0 rgba(255,255,255,.55);
  cursor: pointer;
  transition: transform .06s linear, box-shadow .06s linear;
}
.td-add:hover { filter: brightness(1.07) }
.td-add:active { transform: translateY(3px); box-shadow: 0 1px 0 #45690f, inset 0 1px 0 rgba(255,255,255,.4) }

/* ---------- lista ---------- */
.td-label {
  font-size: 9px; font-weight: 800; letter-spacing: .28em;
  text-transform: uppercase; color: #6f7c56; margin-bottom: 8px; padding-left: 2px;
}
.td-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px }
.td-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--edge);
  background: linear-gradient(180deg, #262a1f, #1c1f16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 2px 0 rgba(0,0,0,.45);
}
.td-item.is-done { background: linear-gradient(180deg, #1e211a, #171a13) }

.td-led {
  flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
  border: 1px solid #454b38; cursor: pointer; padding: 0;
  background: radial-gradient(circle at 35% 30%, #3d4433, #22261c);
  box-shadow: inset 0 2px 4px rgba(0,0,0,.7);
  transition: box-shadow .18s ease, background .18s ease;
}
.td-led:hover { background: radial-gradient(circle at 35% 30%, #4d5540, #2b3024) }
.td-led.on {
  background: radial-gradient(circle at 35% 30%, var(--green-lt), var(--green-dk) 75%);
  box-shadow: 0 0 13px rgba(163,230,53,.85), inset 0 1px 2px rgba(255,255,255,.5);
}

.td-text {
  flex: 1; min-width: 0;
  font-family: VT323, "Courier New", monospace;
  font-size: 20px; line-height: 1.25; color: var(--ink);
  word-break: break-word;
}
.td-item.is-done .td-text { color: #6a7458; text-decoration: line-through }

.td-del {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  color: #5f6a4a; font-size: 15px; line-height: 1; cursor: pointer;
  transition: color .15s ease, border-color .15s ease, background .15s ease;
}
.td-item:hover .td-del { color: var(--danger) }
.td-del:hover { background: rgba(208,96,79,.14); border-color: rgba(208,96,79,.45) }

.td-empty {
  padding: 34px 0; text-align: center;
  font-family: VT323, monospace; font-size: 19px; color: #6b7554;
  border: 1px dashed #3a3f2f; border-radius: 10px;
}

/* ---------- pie ---------- */
.td-foot {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 18px; padding: 0 4px;
  font-size: 9px; font-weight: 600; letter-spacing: .2em;
  text-transform: uppercase; color: #6a7654;
  text-shadow: 0 1px 0 rgba(0,0,0,.6);
}

@keyframes td-blink { 0%,50% { opacity: 1 } 51%,100% { opacity: 0 } }
@keyframes td-breathe { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  .td-cursor, .td-lamp { animation: none }
  .td-meter i { transition: none }
}
      `}</style>

            <div className="td-chassis">
                <span className="td-screw tl" />
                <span className="td-screw tr" />
                <span className="td-screw bl" />
                <span className="td-screw br" />

                <div className="td-inner">
                    <div className="td-plate">
                        <div className="td-brand">Pendientes</div>
                        <div className="td-power">
                            <button
                                className={`td-snd${muted ? " off" : ""}`}
                                onClick={() => setMuted((m) => !m)}
                                aria-label={muted ? "Activar sonido" : "Silenciar"}
                            >
                                {muted ? "SND OFF" : "SND ON"}
                            </button>
                            <span className="td-lamp" />
                        </div>
                    </div>

                    <div className="td-display">
                        <div className="td-readout">
            <span className="td-count">
              {String(pending).padStart(2, "0")}
            </span>
                            <span className="td-caption">
              {pending === 0 ? "todo listo" : pending === 1 ? "cosa por hacer" : "cosas por hacer"}
                                <span className="td-cursor" />
            </span>
                        </div>
                        <div className="td-meter">
                            <i style={{ width: `${progress}%` }} />
                        </div>
                        <div className="td-ticks">
                            <span>0</span>
                            <span>
              {doneCount} / {tasks.length} hechas
            </span>
                            <span>100</span>
                        </div>
                    </div>

                    <div className="td-row">
                        <input
                            className="td-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTask()}
                            placeholder="escribe la tarea..."
                        />
                        <button className="td-add" onClick={addTask}>
                            Añadir
                        </button>
                    </div>

                    <div className="td-label">Registro</div>

                    {tasks.length === 0 ? (
                        <div className="td-empty">sin registros — sistema en reposo</div>
                    ) : (
                        <ul className="td-list">
                            {tasks.map((task) => (
                                <li
                                    key={task.id}
                                    className={`td-item${task.done ? " is-done" : ""}`}
                                >
                                    <button
                                        className={`td-led${task.done ? " on" : ""}`}
                                        onClick={() => toggle(task.id)}
                                        aria-label={task.done ? "Marcar pendiente" : "Marcar hecha"}
                                    />
                                    <span className="td-text">{task.text}</span>
                                    <button
                                        className="td-del"
                                        onClick={() => remove(task.id)}
                                        aria-label="Eliminar"
                                    >
                                        {"\u2715"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="td-foot">
                        <span>Mod. TD-01</span>
                        <span>Enter para añadir</span>
                    </div>
                </div>
            </div>
        </div>
    );
}