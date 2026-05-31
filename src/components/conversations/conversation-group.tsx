"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProspectConversationGroup } from "@/lib/conversation-actions";
import { Monogram } from "@/components/brand";
import { ProspectConversations } from "@/components/prospects/prospect-conversations";

// One collapsible prospect section on the Conversations page. The name stays a
// link to the prospect; the chevron toggles the transcript list.
export function ConversationGroup({
  group,
}: {
  group: ProspectConversationGroup;
}) {
  const [open, setOpen] = useState(true);
  const count = group.conversations.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Link
          href={`/prospects/${group.prospectId}`}
          className="flex items-center gap-2.5 text-foreground"
        >
          <Monogram name={group.prospectName} size={32} />
          <span className="font-semibold">{group.prospectName}</span>
        </Link>
        <span className="text-xs text-muted-foreground">
          {count} conversation{count === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Collapse conversations" : "Expand conversations"}
          className="ml-auto grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronDown
            className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </button>
      </div>

      {open && (
        <ProspectConversations
          conversations={group.conversations}
          showHeading={false}
        />
      )}
    </div>
  );
}
