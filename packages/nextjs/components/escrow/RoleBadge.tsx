"use client";

import type { Role } from "~~/components/escrow/types";

const ROLE_LABEL: Record<Role, string> = {
  buyer: "买家",
  seller: "卖家",
  arbiter: "仲裁人",
  visitor: "旁观者",
};

const ROLE_CLASS: Record<Role, string> = {
  buyer: "badge-primary",
  seller: "badge-secondary",
  arbiter: "badge-accent",
  visitor: "badge-ghost",
};

export const RoleBadge = ({ roles, compact = false }: { roles: Role[]; compact?: boolean }) => {
  const list = roles.length > 0 ? roles : (["visitor"] as Role[]);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {list.map(role => (
        <span key={role} className={`badge ${ROLE_CLASS[role]} ${compact ? "badge-sm" : ""}`}>
          {ROLE_LABEL[role]}
        </span>
      ))}
    </div>
  );
};
