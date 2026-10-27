import { useClerkAppearance } from "@/components/auth/use-clerk-appearance";
import { loadClerkUI } from "@/lib/clerk-ui";
import { useClerk, useUser } from "@clerk/tanstack-react-start";
import { useId, useRef, type ToggleEvent } from "react";
import { LogOut, Settings } from "vadivam-react";

const itemClass =
  "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden select-none [&_svg]:size-4 [&_svg]:shrink-0";

/** Clerk's avatar images take resize parameters; 2x for sharp screens. */
function avatarUrl(imageUrl: string, size: number) {
  const url = new URL(imageUrl);
  url.searchParams.set("width", String(size * 2));
  url.searchParams.set("height", String(size * 2));
  url.searchParams.set("fit", "crop");
  return url.toString();
}

/**
 * The header's account menu, in place of Clerk's `<UserButton>`: rendering
 * that downloads Clerk's whole UI bundle with every signed-in page. This is a
 * native popover; "Manage account" opens Clerk's profile modal, loading its
 * UI then (or earlier, once the menu opens).
 */
export default function UserProfile() {
  const { user } = useUser();
  const clerk = useClerk();
  const appearance = useClerkAppearance();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress;
  const name = user.fullName || user.username || email || "Your account";

  const handleBeforeToggle = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState !== "open") return;
    // Popovers sit in the top layer, so place it under the avatar.
    const button = buttonRef.current?.getBoundingClientRect();
    const menu = menuRef.current;
    if (button && menu) {
      menu.style.top = `${button.bottom + 8}px`;
      menu.style.right = `${document.documentElement.clientWidth - button.right}px`;
    }
    loadClerkUI().catch(() => {
      // "Manage account" tries again.
    });
  };

  const handleToggle = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState === "open") {
      menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  };

  const close = () => menuRef.current?.hidePopover();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={menuId}
        aria-label="Open account menu"
        aria-haspopup="menu"
        className="focus-visible:ring-ring/50 block size-7 shrink-0 overflow-hidden rounded-full outline-none focus-visible:ring-3"
      >
        <img
          src={avatarUrl(user.imageUrl, 28)}
          alt=""
          width={28}
          height={28}
          className="size-full object-cover"
        />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        onBeforeToggle={handleBeforeToggle}
        onToggle={handleToggle}
        className="bg-popover text-popover-foreground ring-foreground/10 fixed inset-auto m-0 w-64 max-w-[calc(100vw-2rem)] rounded-lg p-1 shadow-md ring-1"
      >
        <div className="flex items-center gap-2.5 px-2 py-2">
          <img
            src={avatarUrl(user.imageUrl, 32)}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{name}</p>
            {email && email !== name ? (
              <p className="text-muted-foreground truncate text-xs">{email}</p>
            ) : null}
          </div>
        </div>
        <div className="bg-border -mx-1 my-1 h-px" />
        <div role="menu" aria-label="Account">
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              close();
              clerk.openUserProfile({ appearance });
            }}
          >
            <Settings />
            Manage account
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              close();
              void clerk.signOut();
            }}
          >
            <LogOut />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
