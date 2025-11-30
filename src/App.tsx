import { useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase-config";
import Footer from "./components/footer";
import gecLogo from "./assets/gec_logo.png";

type User = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  lastRenewal?: Date;
  expiresAt?: Date;
};

const toDate = (value: unknown) => {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
};

const formatDate = (value?: Date) =>
  value
    ? value.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "--";

const addMonths = (start: Date, months: number) => {
  const copy = new Date(start);
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

const isActive = (expiresAt?: Date) => {
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now();
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogUser, setDialogUser] = useState<User | null>(null);
  const [cancelDialogUser, setCancelDialogUser] = useState<User | null>(null);
  const [duration, setDuration] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "users"));
        const mapped: User[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: (data.name as string) ?? (data.fullName as string),
              phone: data.phone ?? data.phoneNumber ?? "",
              email: data.email ?? "",
              lastRenewal: toDate(data.lastRenewal),
              expiresAt:
                toDate(data.expiresAt) ?? toDate(data.subscriptionEndsAt),
            };
          })
          .filter((user) => Boolean(user.phone));
        setUsers(mapped);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sanitizedSearch = search.replace(/\D/g, "");

  const filteredUsers = useMemo(() => {
    if (!sanitizedSearch) return users;
    return users.filter((user) =>
      (user.phone ?? "").replace(/\D/g, "").includes(sanitizedSearch)
    );
  }, [users, sanitizedSearch]);

  const openDialog = (user: User) => {
    setDialogUser(user);
    setDuration(1);
  };

  const handleActivate = async () => {
    if (!dialogUser) return;
    const now = new Date();
    const baseDate =
      dialogUser.expiresAt && dialogUser.expiresAt > now
        ? dialogUser.expiresAt
        : now;
    const newExpiry = addMonths(baseDate, duration);
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", dialogUser.id), {
        lastRenewal: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(newExpiry),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === dialogUser.id
            ? { ...u, lastRenewal: now, expiresAt: newExpiry }
            : u
        )
      );
      setDialogUser(null);
    } catch (err) {
      console.error(err);
      setError("Activation impossible, reessaie.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelDialogUser) return;
    try {
      await updateDoc(doc(db, "users", cancelDialogUser.id), {
        expiresAt: null,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === cancelDialogUser.id ? { ...u, expiresAt: undefined } : u
        )
      );
      setCancelDialogUser(null);
    } catch (err) {
      console.error(err);
      setError("Annulation impossible, reessaie.");
    }
  };

  return (
    <>
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <img
          src={gecLogo}
          alt="Logo GEC"
          style={{ height: 48, width: 48, objectFit: "contain" }}
        />
        <h1 style={{ margin: 0 }}>Gestion des abonnements - GEC APP</h1>
      </header>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Recherche par numero de telephone
        </label>
        <input
          type="search"
          placeholder="Ex: 0601020304"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px 12px",
            width: "320px",
            maxWidth: "100%",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: "14px",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "10px 12px",
            borderRadius: 8,
            marginBottom: 12,
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "900px",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 12 }}>Statut</th>
              <th style={{ textAlign: "left", padding: 12 }}>Nom</th>
              <th style={{ textAlign: "left", padding: 12 }}>Telephone</th>
              <th style={{ textAlign: "left", padding: 12 }}>Email</th>
              <th style={{ textAlign: "left", padding: 12 }}>
                Dernier reabonnement
              </th>
              <th style={{ textAlign: "left", padding: 12 }}>
                Expiration abonnement
              </th>
              <th style={{ textAlign: "left", padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td style={{ padding: 12 }} colSpan={7}>
                  Chargement...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td style={{ padding: 12 }} colSpan={7}>
                  Aucun utilisateur
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const active = isActive(user.expiresAt);
                const actionLabel = active ? "Prolonger" : "Activer";
                return (
                  <tr key={user.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          color: active ? "#15803d" : "#b91c1c",
                          fontWeight: 600,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: active ? "#22c55e" : "#ef4444",
                            boxShadow: `0 0 0 4px ${
                              active
                                ? "rgba(34,197,94,0.2)"
                                : "rgba(239,68,68,0.2)"
                            }`,
                          }}
                        />
                        {active ? "Actif" : "Expire/Off"}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{user.name || "--"}</td>
                    <td style={{ padding: 12 }}>{user.phone || "--"}</td>
                    <td style={{ padding: 12 }}>{user.email || "--"}</td>
                    <td style={{ padding: 12 }}>{formatDate(user.lastRenewal)}</td>
                    <td style={{ padding: 12 }}>{formatDate(user.expiresAt)}</td>
                    <td style={{ padding: 12, display: "flex", gap: 8 }}>
                      <button
                        style={{
                          background: active ? "#16a34a" : "#2563eb",
                          color: "white",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                        }}
                        onClick={() => openDialog(user)}
                      >
                        {actionLabel} abonnement
                      </button>
                      <button
                        style={{
                          background: "#f8fafc",
                          color: "#0f172a",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                        onClick={() => setCancelDialogUser(user)}
                      >
                        Annuler l'abonnement
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {dialogUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 20,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 16px 60px rgba(15,23,42,0.18)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>
              {isActive(dialogUser.expiresAt)
                ? "Prolonger l'abonnement"
                : "Activer l'abonnement"}
            </h2>
            <p style={{ marginTop: 0, color: "#475569" }}>
              {dialogUser.name || dialogUser.phone || dialogUser.email}
            </p>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Duree (mois)
            </label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{
                width: "120px",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDialogUser(null)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleActivate}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                }}
                disabled={saving}
              >
                {saving ? "En cours..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelDialogUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 20,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 16px 60px rgba(15,23,42,0.18)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>
              Annuler l'abonnement
            </h2>
            <p style={{ marginTop: 0, color: "#475569" }}>
              {cancelDialogUser.name ||
                cancelDialogUser.phone ||
                cancelDialogUser.email}
            </p>
            <p style={{ marginTop: 0, color: "#0f172a", fontWeight: 600 }}>
              Confirmer l'annulation de l'abonnement en cours ?
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setCancelDialogUser(null)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                Fermer
              </button>
              <button
                onClick={handleCancelSubscription}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                }}
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <Footer />
    </>
  );
}

export default App;
