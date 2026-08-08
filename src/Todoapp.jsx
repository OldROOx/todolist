import { useState, useRef, useEffect } from "react";

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

    // Guarda las tareas cada vez que cambian
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch {
            // storage no disponible, se ignora
        }
    }, [tasks]);
    const [input, setInput] = useState("");
    const [hoverId, setHoverId] = useState(null);
    const nextId = useRef(
        tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1
    );

    const addTask = () => {
        const text = input.trim();
        if (!text) return;
        setTasks((t) => [{ id: nextId.current++, text, done: false }, ...t]);
        setInput("");
    };

    const toggle = (id) =>
        setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

    const remove = (id) => setTasks((t) => t.filter((x) => x.id !== id));

    const pending = tasks.filter((t) => !t.done).length;

    const styles = {
        page: {
            minHeight: "100vh",
            width: "100%",
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            fontFamily:
                "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            boxSizing: "border-box",
        },
        container: { width: "100%", maxWidth: "440px" },
        header: { marginBottom: "32px" },
        title: {
            fontSize: "48px",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#fff",
            margin: 0,
            lineHeight: 1,
        },
        dot: { color: "#a3e635" },
        subtitle: { marginTop: "8px", fontSize: "14px", color: "#737373" },
        inputRow: { display: "flex", gap: "8px", marginBottom: "24px" },
        input: {
            flex: 1,
            background: "#171717",
            color: "#fff",
            borderRadius: "16px",
            padding: "16px 20px",
            outline: "none",
            border: "1px solid #262626",
            fontSize: "15px",
        },
        addBtn: {
            background: "#a3e635",
            color: "#0a0a0a",
            borderRadius: "16px",
            padding: "0 20px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            fontWeight: 700,
        },
        list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" },
        empty: {
            textAlign: "center",
            color: "#525252",
            padding: "48px 0",
            fontSize: "14px",
        },
        item: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: "16px",
            padding: "14px 16px",
        },
        circle: {
            flexShrink: 0,
            width: "24px",
            height: "24px",
            borderRadius: "999px",
            border: "2px solid #525252",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
        },
        circleDone: {
            flexShrink: 0,
            width: "24px",
            height: "24px",
            borderRadius: "999px",
            border: "2px solid #a3e635",
            background: "#a3e635",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            color: "#0a0a0a",
            fontSize: "14px",
            fontWeight: 700,
        },
        text: { flex: 1, fontSize: "15px", color: "#f5f5f5" },
        textDone: {
            flex: 1,
            fontSize: "15px",
            color: "#525252",
            textDecoration: "line-through",
        },
        delBtn: {
            flexShrink: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ef4444",
            fontSize: "18px",
            padding: "4px",
            lineHeight: 1,
        },
        hint: {
            marginTop: "32px",
            textAlign: "center",
            fontSize: "12px",
            color: "#404040",
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>
                        hoy<span style={styles.dot}>.</span>
                    </h1>
                    <p style={styles.subtitle}>
                        {pending === 0
                            ? "todo listo, crack"
                            : `${pending} ${pending === 1 ? "cosa pendiente" : "cosas pendientes"}`}
                    </p>
                </div>

                <div style={styles.inputRow}>
                    <input
                        style={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTask()}
                        placeholder="¿qué hay que hacer?"
                    />
                    <button style={styles.addBtn} onClick={addTask} aria-label="Agregar">
                        +
                    </button>
                </div>

                <ul style={styles.list}>
                    {tasks.length === 0 && (
                        <li style={styles.empty}>sin tareas. disfruta el silencio.</li>
                    )}
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            style={styles.item}
                            onMouseEnter={() => setHoverId(task.id)}
                            onMouseLeave={() => setHoverId(null)}
                        >
                            <button
                                style={task.done ? styles.circleDone : styles.circle}
                                onClick={() => toggle(task.id)}
                                aria-label={task.done ? "Marcar pendiente" : "Completar"}
                            >
                                {task.done ? "\u2713" : ""}
                            </button>

                            <span style={task.done ? styles.textDone : styles.text}>
                {task.text}
              </span>

                            <button
                                style={{
                                    ...styles.delBtn,
                                    opacity: hoverId === task.id ? 1 : 0,
                                }}
                                onClick={() => remove(task.id)}
                                aria-label="Eliminar"
                            >
                                {"\u2715"}
                            </button>
                        </li>
                    ))}
                </ul>

                <p style={styles.hint}>
                    enter para agregar · toca el círculo para completar
                </p>
            </div>
        </div>
    );
}