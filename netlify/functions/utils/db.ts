import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  deleteDoc 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import bcrypt from "bcryptjs";
import firebaseConfig from "../../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface AdminUser {
  username: string;
  password?: string;
  role: string;
  recoveryEmail?: string;
  recoveryQuestion?: string;
  recoveryAnswer?: string;
}

export interface StudentUser {
  id: string;
  password?: string;
  passwordClear?: string;
  studentName: string;
  dob?: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  school?: string;
  studentClass?: string;
  teacherName?: string;
  teacherEmail?: string;
  teacherPhone?: string;
  status: string;
  score: string;
}

export interface SettingsType {
  round: number;
  questionCount: number;
  timeMinutes: number;
  isLive: boolean;
  voiceActive?: boolean;
}

export interface QuestionType {
  id: number;
  subject: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
  round: number;
  docId?: string;
}

export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const colRef = collection(db, "admins");
    const snapshot = await getDocs(colRef);
    const list: AdminUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        username: docSnap.id,
        password: data.password,
        role: data.role || "sub_admin",
        recoveryEmail: data.recoveryEmail || "admin@fazcollege.com.ng",
        recoveryQuestion: data.recoveryQuestion || "What is your favorite academic subject?",
        recoveryAnswer: data.recoveryAnswer || "Mathematics"
      });
    });
    return list;
  } catch (err) {
    console.error("Error getting admins from Firestore:", err);
    return [];
  }
}

export async function getAdmin(username: string): Promise<AdminUser | null> {
  try {
    const docRef = doc(db, "admins", username);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        username: docSnap.id,
        password: data.password,
        role: data.role,
        recoveryEmail: data.recoveryEmail,
        recoveryQuestion: data.recoveryQuestion,
        recoveryAnswer: data.recoveryAnswer
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching admin from Firestore:", err);
    return null;
  }
}

export async function saveAdmin(admin: AdminUser): Promise<void> {
  try {
    let passwordToSave = admin.password;
    if (passwordToSave && !passwordToSave.startsWith("$2")) {
      passwordToSave = bcrypt.hashSync(passwordToSave, 10);
    }
    const docRef = doc(db, "admins", admin.username);
    await setDoc(docRef, {
      password: passwordToSave || "",
      role: admin.role,
      recoveryEmail: admin.recoveryEmail || "admin@fazcollege.com.ng",
      recoveryQuestion: admin.recoveryQuestion || "What is your favorite academic subject?",
      recoveryAnswer: admin.recoveryAnswer || "Mathematics"
    });
  } catch (err) {
    console.error("Error saving admin to Firestore:", err);
  }
}

export async function removeAdmin(username: string): Promise<void> {
  try {
    const docRef = doc(db, "admins", username);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error removing admin from Firestore:", err);
  }
}

export async function getUsers(): Promise<StudentUser[]> {
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    const list: StudentUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== "deleted") {
        list.push({
          id: data.id || docSnap.id,
          password: data.password,
          passwordClear: data.passwordClear || "",
          studentName: data.studentName,
          dob: data.dob,
          parentName: data.parentName,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          school: data.school,
          studentClass: data.studentClass,
          teacherName: data.teacherName,
          teacherEmail: data.teacherEmail,
          teacherPhone: data.teacherPhone,
          status: data.status,
          score: String(data.score ?? "0")
        });
      }
    });
    return list;
  } catch (err) {
    console.error("Error getting users from Firestore:", err);
    return [];
  }
}

export async function saveUser(user: StudentUser): Promise<void> {
  try {
    let passwordToSave = user.password;
    if (passwordToSave && !passwordToSave.startsWith("$2")) {
      passwordToSave = bcrypt.hashSync(passwordToSave, 10);
    }
    const docRef = doc(db, "users", user.id);
    await setDoc(docRef, {
      password: passwordToSave || "",
      passwordClear: user.passwordClear || "",
      studentName: user.studentName,
      dob: user.dob || "",
      parentName: user.parentName,
      parentEmail: user.parentEmail,
      parentPhone: user.parentPhone || "",
      school: user.school || "",
      studentClass: user.studentClass || "",
      teacherName: user.teacherName || "",
      teacherEmail: user.teacherEmail || "",
      teacherPhone: user.teacherPhone || "",
      status: user.status || "active",
      score: String(user.score ?? "0")
    });
  } catch (err) {
    console.error("Error saving user to Firestore:", err);
  }
}

export async function clearUsers(): Promise<void> {
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "users", docSnap.id));
    }
  } catch (err) {
    console.error("Error clearing users from Firestore:", err);
  }
}

export async function updateUserStatus(ids: string[], action: string): Promise<void> {
  try {
    for (const id of ids) {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        await setDoc(docRef, { ...data, status: action });
      }
    }
  } catch (err) {
    console.error("Error updating user status in Firestore:", err);
  }
}

export async function getSettings(): Promise<SettingsType> {
  try {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        round: data.round ?? 2,
        questionCount: data.questionCount ?? 10,
        timeMinutes: data.timeMinutes ?? 30,
        isLive: data.isLive ?? false,
        voiceActive: data.voiceActive ?? false
      };
    } else {
      const def: SettingsType = {
        round: 2,
        questionCount: 10,
        timeMinutes: 30,
        isLive: false,
        voiceActive: false
      };
      await saveSettings(def);
      return def;
    }
  } catch (err) {
    console.error("Error getting settings from Firestore:", err);
    return {
      round: 2,
      questionCount: 10,
      timeMinutes: 30,
      isLive: false,
      voiceActive: false
    };
  }
}

export async function saveSettings(settings: Partial<SettingsType>): Promise<void> {
  try {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    const existing = docSnap.exists() ? docSnap.data() : {};
    await setDoc(docRef, {
      round: settings.round !== undefined ? settings.round : (existing.round ?? 2),
      questionCount: settings.questionCount !== undefined ? settings.questionCount : (existing.questionCount ?? 10),
      timeMinutes: settings.timeMinutes !== undefined ? settings.timeMinutes : (existing.timeMinutes ?? 30),
      isLive: settings.isLive !== undefined ? settings.isLive : (existing.isLive ?? false),
      voiceActive: settings.voiceActive !== undefined ? settings.voiceActive : (existing.voiceActive ?? false)
    });
  } catch (err) {
    console.error("Error saving settings to Firestore:", err);
  }
}

export async function getQuestions(round: number | null = null): Promise<QuestionType[]> {
  try {
    const colRef = collection(db, "questions");
    const snapshot = await getDocs(colRef);
    const list: QuestionType[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const storedId = data.id !== undefined ? parseInt(data.id) : null;
      const docParsedId = parseInt(docSnap.id);
      const qId = (storedId !== null && !isNaN(storedId)) ? storedId : (isNaN(docParsedId) ? 0 : docParsedId);

      list.push({
        id: qId,
        subject: data.subject || "General",
        text: data.text || "",
        optionA: data.optionA || "",
        optionB: data.optionB || "",
        optionC: data.optionC || "",
        optionD: data.optionD || "",
        correct: data.correct || "",
        round: data.round !== undefined ? data.round : 1,
        docId: docSnap.id
      });
    });
    if (round !== null) {
      return list.filter(q => q.round === parseInt(round as any) || !q.round);
    }
    return list;
  } catch (err) {
    console.error("Error getting questions from Firestore:", err);
    return [];
  }
}

export async function saveQuestions(questionsList: Partial<QuestionType>[]): Promise<void> {
  try {
    const settings = await getSettings();
    const defaultRound = settings.round || 1;
    for (const q of questionsList) {
      const qId = q.id || Math.floor(Math.random() * 100000);
      const qRound = q.round !== undefined ? q.round : defaultRound;
      const docId = `r${qRound}_q${qId}`;
      const docRef = doc(db, "questions", docId);
      await setDoc(docRef, {
        id: qId,
        subject: q.subject || "General",
        text: q.text || "",
        optionA: q.optionA || "",
        optionB: q.optionB || "",
        optionC: q.optionC || "",
        optionD: q.optionD || "",
        correct: q.correct || "",
        round: qRound
      });
    }
  } catch (err) {
    console.error("Error saving questions to Firestore:", err);
  }
}

export async function clearQuestions(): Promise<void> {
  try {
    const colRef = collection(db, "questions");
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "questions", docSnap.id));
    }
  } catch (err) {
    console.error("Error clearing questions from Firestore:", err);
  }
}

export async function deleteQuestion(docId: string): Promise<void> {
  try {
    const docRef = doc(db, "questions", docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting single question from Firestore:", err);
  }
}
