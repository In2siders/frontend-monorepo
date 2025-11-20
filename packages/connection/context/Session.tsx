// '* as React' cuz this shit doesn't work without it.
import * as React from "react";

export type Session = {
    sessionToken: string;
};

type SessionContextType = {
    session: Session | null;
    setSession: (session: Session, days?: number) => void;
    clearSession: () => void;
};

// Name
const COOKIE_NAME = "app_session";

// Check if is react compiler, server-side rendering or browser
const isBrowser = typeof document !== "undefined";

function readCookie(name: string): string | null {
    if (!isBrowser) return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function writeCookie(name: string, value: string, days = 7) {
    if (!isBrowser) return;
    const maxAge = days * 24 * 60 * 60;
    // Using SameSite=Lax and path=/; adjust attributes if needed
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
    if (!isBrowser) return;
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
}

const SessionContext = React.createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSessionState] = React.useState<Session | null>(() => {
        try {
            const raw = readCookie(COOKIE_NAME);
            return raw ? (JSON.parse(raw) as Session) : null;
        } catch {
            return null;
        }
    });

    React.useEffect(() => {
        // Keep state in sync if cookie changes externally (basic polling fallback).
        // In most apps this isn't necessary; remove if unwanted.
        let mounted = true;
        const check = () => {
            if (!mounted) return;
            try {
                const raw = readCookie(COOKIE_NAME);
                const parsed = raw ? (JSON.parse(raw) as Session) : null;
                setSessionState((prev) => {
                    const equal =
                        (prev === null && parsed === null) ||
                        (prev !== null && parsed !== null && prev.sessionToken === parsed.sessionToken);
                    return equal ? prev : parsed;
                });
            } catch {
                // ignore
            }
        };
        const id = setInterval(check, 2000);
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, []);

    const setSession = (s: Session, days = 7) => {
        try {
            writeCookie(COOKIE_NAME, JSON.stringify(s), days);
            setSessionState(s);
        } catch {
            // ignore
        }
    };

    const clearSession = () => {
        removeCookie(COOKIE_NAME);
        setSessionState(null);
    };

    return (
        <SessionContext.Provider value={{ session, setSession, clearSession }}>
            {children}
        </SessionContext.Provider>
    );
};

export function useSession() {
    const ctx = React.useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used within a SessionProvider");
    return ctx;
}