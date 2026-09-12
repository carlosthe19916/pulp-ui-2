const STORAGE_KEY = "pulp-credentials";

const listeners = new Set<() => void>();

export interface IStoredCredentials {
  username: string;
  password: string;
  remember: boolean;
}

export function encodeBasicAuthHeader(
  username: string,
  password: string,
): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return (
    sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)
  );
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function loadCredentials(): IStoredCredentials | null {
  const raw = getSnapshot();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as IStoredCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: IStoredCredentials): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  if (credentials.remember) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  notify();
}

export function clearCredentials(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  notify();
}
