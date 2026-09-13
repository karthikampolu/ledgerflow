import { isFirebaseConfigured } from "@/lib/firebase";
import { DataProvider } from "@/lib/data/provider";
import { localProvider } from "@/lib/data/localProvider";
import { firebaseProvider } from "@/lib/data/firebaseProvider";

/** Single active data provider for the whole app, chosen automatically. */
export const db: DataProvider = isFirebaseConfigured ? firebaseProvider : localProvider;

export type { DataProvider, AuthResult } from "@/lib/data/provider";
