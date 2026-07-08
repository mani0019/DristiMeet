import { MonacoBinding } from "y-monaco";
import { Editor } from "@monaco-editor/react";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function CollabEditor({ roomId, username, serverUrl, onClose }) {
  const editorRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [editorReady, setEditorReady] = useState(false);
  const [connected, setConnected] = useState(false);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const handleMount = (editor) => {
    editorRef.current = editor;
    setEditorReady(true);
  };

  useEffect(() => {
    if (!username || !roomId || !editorReady) return;

    if (yText.length === 0) {
      yText.insert(0, "// write your code here");
    }

    const provider = new SocketIOProvider(serverUrl, roomId, ydoc, { autoConnect: true });

    const COLORS = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
      "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
      "#BB8FCE", "#85C1E9"
    ];
    const color = COLORS[
      username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length
    ];

    provider.awareness.setLocalStateField("user", { username, color, colorLight: color + "33" });

    const handleAwareness = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.filter((s) => s.user?.username).map((s) => s.user));
    };
    provider.awareness.on("change", handleAwareness);
    handleAwareness();

    provider.on("status", ({ status }) => setConnected(status === "connected"));

    const handleBeforeUnload = () => provider.awareness.setLocalStateField("user", null);
    window.addEventListener("beforeunload", handleBeforeUnload);

    const monacoBinding = new MonacoBinding(
      yText, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness
    );

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      provider.awareness.off("change", handleAwareness);
      monacoBinding.destroy();
      provider.destroy();
    };
  }, [username, roomId, editorReady]);

  const initials = (name) => name.trim().slice(0, 2).toUpperCase();

  return (
    <div style={styles.wrapper}>
      <section style={styles.editorSection}>
        <div style={styles.editorHeader}>
          <div style={styles.dot(connected)} />
          <span style={styles.headerText}>
            {connected ? "Live — synced" : "Connecting…"}
          </span>
        </div>
        <div style={styles.editorBox}>
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            defaultValue="// write your code here"
            onMount={handleMount}
            options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 12 } }}
          />
        </div>
      </section>

      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Editing now</span>
          <span style={styles.badge}>{users.length}</span>
        </div>
        <ul style={styles.userList}>
          {users.map((user, i) => (
            <li key={i} style={styles.userRow}>
              <span style={styles.avatar(user.color)}>{initials(user.username)}</span>
              <span style={styles.userName}>
                {user.username}
                {user.username === username && <span style={styles.youTag}> (you)</span>}
              </span>
            </li>
          ))}
          {users.length === 0 && <li style={styles.emptyState}>Waiting for others…</li>}
        </ul>
      </aside>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    height: "100%",
    width: "100%",
    gap: 12,
  },
  editorSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#151823",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #262b3d",
  },
  editorHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderBottom: "1px solid #262b3d",
    background: "#1a1e2b",
  },
  dot: (on) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: on ? "#4ade80" : "#facc15",
    boxShadow: on ? "0 0 6px #4ade80" : "0 0 6px #facc15",
  }),
  headerText: { color: "#9ca3af", fontSize: 13, fontWeight: 500 },
  editorBox: { flex: 1, minHeight: 0 },
  sidebar: {
    width: 220,
    background: "#151823",
    borderRadius: 12,
    border: "1px solid #262b3d",
    padding: 14,
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sidebarTitle: { color: "#e5e7eb", fontSize: 14, fontWeight: 600 },
  badge: {
    background: "#262b3d",
    color: "#9ca3af",
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
  },
  userList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  userRow: { display: "flex", alignItems: "center", gap: 10 },
  avatar: (color) => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: color,
    color: "#111",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  userName: { color: "#e5e7eb", fontSize: 13 },
  youTag: { color: "#6b7280", fontSize: 11 },
  emptyState: { color: "#6b7280", fontSize: 12, fontStyle: "italic" },
};

export default CollabEditor;