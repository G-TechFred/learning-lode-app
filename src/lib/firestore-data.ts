import {
collection,
doc,
getDoc,
getDocs,
setDoc,
serverTimestamp,
} from “firebase/firestore”;

import { db } from “@/firebase”;

export type SchoolUserRole =
| “administrator”
| “teacher”
| “student”
| “parent”;

export type SchoolUserProfile = {
uid: string;
email: string;
fullName: string;
role: SchoolUserRole;
createdAt?: unknown;
};

export type AcademicRecord = {
id: string;
studentId: string;
subject: string;
term: string;
academicYear: string;
kind: “assignment” | “quiz” | “test” | “examination”;
title: string;
score: number | null;
maxScore: number;
feedback: string;
createdBy: string;
createdAt?: unknown;
};

/**

* Save a profile using the Firebase Authentication UID as its document ID.
* Call this only after the user’s role has been assigned by a trusted process.
    */
    export async function saveUserProfile(
    profile: Omit<SchoolUserProfile, “createdAt”>,
    ): Promise {
    await setDoc(
    doc(db, “users”, profile.uid),
    {
    …profile,
    createdAt: serverTimestamp(),
    },
    { merge: true },
    );
    }

/** Retrieve one profile by its Firebase Authentication UID. */
export async function getUserProfile(
uid: string,
): Promise<SchoolUserProfile | null> {
const snapshot = await getDoc(doc(db, “users”, uid));

if (!snapshot.exists()) return null;

return snapshot.data() as SchoolUserProfile;
}

/**

* Save an academic record with a stable document ID.
* Firestore Security Rules must authorize the caller before this can succeed.
    */
    export async function saveAcademicRecord(
    record: AcademicRecord,
    ): Promise {
    await setDoc(
    doc(db, “academicRecords”, record.id),
    {
    …record,
    createdAt: serverTimestamp(),
    },
    { merge: true },
    );
    }

/** Read academic records; Security Rules must restrict which records are visible. */
export async function getAcademicRecords(): Promise<AcademicRecord[]> {
const snapshot = await getDocs(collection(db, “academicRecords”));

return snapshot.docs.map((item) => ({
…item.data(),
id: item.id,
})) as AcademicRecord[];
}