import { db } from "@/firebase-config";
import { collection, addDoc } from "firebase/firestore";

await addDoc(collection(db, "users"), {
  name: "Innovation",
  age: 22,
});
