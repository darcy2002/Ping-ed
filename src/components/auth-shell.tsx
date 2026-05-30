import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

// Marketing-flavoured frame for the sign-in / sign-up cards: brand header with
// a theme toggle, centered content, on the faint surface wash.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex items-center px-6 py-5">
        <Wordmark size={22} />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        {children}
      </div>
    </div>
  );
}
