import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, UserRole } from "@/types";

// ============================================================
// ログイン・ログアウト
// ============================================================

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getUserDocument(credential.user.uid);

  if (!userDoc) {
    await firebaseSignOut(auth);
    throw new Error("アカウント情報が見つかりません。管理者に連絡してください。");
  }

  if (!userDoc.isActive) {
    await firebaseSignOut(auth);
    throw new Error("このアカウントは無効になっています。");
  }

  return { firebaseUser: credential.user, userData: userDoc };
}

export async function signOut() {
  await firebaseSignOut(auth);
}

// ============================================================
// ユーザー情報取得
// ============================================================

export async function getUserDocument(uid: string): Promise<User | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  return { id: userSnap.id, ...userSnap.data() } as User & { id: string };
}

// ============================================================
// 権限チェック
// ============================================================

export function canAccess(role: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    owner: 3,
    manager: 2,
    staff: 1,
  };
  return hierarchy[role] >= hierarchy[requiredRole];
}

/** 売上管理・分析・店舗設定にアクセスできるか */
export function canAccessAdmin(role: UserRole): boolean {
  return canAccess(role, "manager");
}

/** アカウント管理にアクセスできるか */
export function canManageAccounts(role: UserRole): boolean {
  return canAccess(role, "manager");
}

// ============================================================
// Auth状態監視
// ============================================================

export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}
