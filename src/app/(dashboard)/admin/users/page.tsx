"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const ROLES = ["ATHLETE", "COACH", "INVESTOR", "ADMIN", "OWNER"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  ATHLETE: "Атлет",
  COACH: "Тренер",
  INVESTOR: "Інвестор",
  ADMIN: "Адмін",
  OWNER: "Власник",
};

const ROLE_COLORS: Record<Role, string> = {
  ATHLETE: "text-blue-400 bg-blue-400/10",
  COACH: "text-green-400 bg-green-400/10",
  INVESTOR: "text-yellow-400 bg-yellow-400/10",
  ADMIN: "text-primary bg-primary/10",
  OWNER: "text-purple-400 bg-purple-400/10",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const usersQuery = trpc.admin.getUsers.useQuery({
    page,
    perPage: 20,
    role: role === "ALL" ? undefined : role,
    search: search || undefined,
  });

  const data = usersQuery.data;
  const users = data?.users ?? [];

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleRole(val: Role | "ALL") {
    setRole(val);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Управління <span className="text-primary">користувачами</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {data?.total ?? "..."} користувачів на платформі
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Пошук за ім'ям або email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleRole("ALL")}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
              role === "ALL"
                ? "bg-primary text-white border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Всі
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => handleRole(r)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                role === r
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Користувач
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Роль
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Країна
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Розмови
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Реєстрація
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Завантаження...
                  </td>
                </tr>
              )}
              {!usersQuery.isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Користувачів не знайдено
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{user.name ?? "Без імені"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[user.role as Role]}`}>
                      {ROLE_LABELS[user.role as Role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{user.country ?? "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{user._count.conversations}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("uk")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Сторінка {data.page} з {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-secondary disabled:opacity-40 cursor-pointer hover:bg-secondary/70"
              >
                ← Назад
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-secondary disabled:opacity-40 cursor-pointer hover:bg-secondary/70"
              >
                Далі →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
