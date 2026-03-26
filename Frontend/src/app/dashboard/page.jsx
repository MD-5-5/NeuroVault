"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUser, signOut, onAuthChange } from "@/lib/supabase/auth";
import { getVaultEntries, searchVaultEntries, getProfile } from "@/lib/supabase/db";
import { uploadFile, listUserFiles } from "@/lib/supabase/storage";
import { subscribeToVault } from "@/lib/supabase/realtime";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (session) => {
      if (!session) {
        router.push("/login");
        return;
      }
      const u = session.user;
      setUser(u);
      try {
        const [p, e, f] = await Promise.all([
          getProfile(u.id),
          getVaultEntries(u.id),
          listUserFiles(u.id),
        ]);
        setProfile(p);
        setEntries(e ?? []);
        setFiles(f ?? []);
      } catch (_) {}
      setLoading(false);
    });
    return unsub;
  }, [router]);

  // ── Realtime sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return subscribeToVault(user.id, {
      onInsert: (e) => setEntries((prev) => [e, ...prev]),
      onUpdate: (e) =>
        setEntries((prev) => prev.map((x) => (x.id === e.id ? e : x))),
      onDelete: (e) =>
        setEntries((prev) => prev.filter((x) => x.id !== e.id)),
    });
  }, [user]);

  // ── Search ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(async () => {
      if (search.trim()) {
        const results = await searchVaultEntries(user.id, search);
        setEntries(results ?? []);
      } else {
        const all = await getVaultEntries(user.id);
        setEntries(all ?? []);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, user]);

  // ── File upload ─────────────────────────────────────────────────────────
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      await uploadFile(user.id, file);
      const updated = await listUserFiles(user.id);
      setFiles(updated ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  const pinned = entries.filter((e) => e.is_pinned).length;
  const totalFiles = files.length;
  const tags = [...new Set(entries.flatMap((e) => e.tags ?? []))].length;

  const stats = [
    { label: "Vault Entries", value: entries.length, icon: "🧠" },
    { label: "Pinned", value: pinned, icon: "📌" },
    { label: "Files Stored", value: totalFiles, icon: "📁" },
    { label: "Unique Tags", value: tags, icon: "🏷️" },
  ];

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.logoIcon}>⬡</span>
        <p>Loading your vault…</p>
      </div>
    );
  }

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.shell}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>NeuroVault</span>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className={styles.signOutBtn} onClick={handleSignOut}>
          ↩ Sign Out
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search your vault…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Profile avatar */}
          <div className={styles.avatarWrap}>
            <button
              className={styles.avatar}
              onClick={() => setShowProfile((v) => !v)}
              title="Profile"
            >
              {initials}
            </button>

            {showProfile && (
              <div className={styles.profileDropdown}>
                <p className={styles.profileName}>{displayName}</p>
                <p className={styles.profileEmail}>{user?.email}</p>
                <hr className={styles.profileDivider} />
                <button className={styles.profileSignOut} onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <section className={styles.section}>
            <h1 className={styles.pageTitle}>
              Good to see you, {displayName.split(" ")[0]} 👋
            </h1>

            {/* Stats */}
            <div className={styles.statsGrid}>
              {stats.map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Recent entries */}
            <h2 className={styles.sectionHeading}>Recent Entries</h2>
            {entries.length === 0 ? (
              <EmptyState message="No vault entries yet. Create your first one!" />
            ) : (
              <div className={styles.entryList}>
                {entries.slice(0, 5).map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── FILES TAB ── */}
        {activeTab === "files" && (
          <section className={styles.section}>
            <h1 className={styles.pageTitle}>File Storage</h1>

            <div
              className={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && user) {
                  setUploading(true);
                  uploadFile(user.id, file)
                    .then(() => listUserFiles(user.id))
                    .then((f) => setFiles(f ?? []))
                    .finally(() => setUploading(false));
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleUpload}
              />
              {uploading ? (
                <><span className={styles.uploadSpinner} /> Uploading…</>
              ) : (
                <>
                  <span className={styles.uploadIcon}>⬆</span>
                  <p>Click or drag & drop a file to upload</p>
                  <span className={styles.uploadSub}>Any file type supported</span>
                </>
              )}
            </div>

            <h2 className={styles.sectionHeading}>Stored Files ({totalFiles})</h2>
            {files.length === 0 ? (
              <EmptyState message="No files uploaded yet." />
            ) : (
              <div className={styles.fileList}>
                {files.map((file) => (
                  <div key={file.name} className={styles.fileRow}>
                    <span className={styles.fileIcon}>📄</span>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {file.metadata?.size
                        ? `${(file.metadata.size / 1024).toFixed(1)} KB`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <section className={styles.section}>
            <h1 className={styles.pageTitle}>Your Profile</h1>
            <div className={styles.profileCard}>
              <div className={styles.profileAvatar}>{initials}</div>
              <div className={styles.profileInfo}>
                <p className={styles.profileInfoName}>{displayName}</p>
                <p className={styles.profileInfoEmail}>{user?.email}</p>
                <p className={styles.profileInfoJoined}>
                  Member since{" "}
                  {new Date(user?.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className={styles.profileStats}>
              {stats.map((s) => (
                <div key={s.label} className={styles.profileStat}>
                  <span>{s.icon}</span>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function EntryCard({ entry }) {
  return (
    <div className={styles.entryCard}>
      {entry.is_pinned && <span className={styles.pin}>📌</span>}
      <h3 className={styles.entryTitle}>{entry.title}</h3>
      {entry.content && (
        <p className={styles.entryContent}>
          {entry.content.slice(0, 120)}
          {entry.content.length > 120 ? "…" : ""}
        </p>
      )}
      <div className={styles.entryMeta}>
        <span>{new Date(entry.updated_at).toLocaleDateString()}</span>
        {entry.tags?.length > 0 && (
          <div className={styles.entryTags}>
            {entry.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className={styles.emptyState}>
      <span>🗄️</span>
      <p>{message}</p>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "overview", icon: "◈", label: "Overview" },
  { id: "files",    icon: "📁", label: "Files" },
  { id: "profile",  icon: "👤", label: "Profile" },
];