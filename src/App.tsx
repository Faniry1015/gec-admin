
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc  } from "firebase/firestore";
import { db } from "./firebase-config";
import { Button } from "./components/ui/button";

function App() {
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "users"));
      snap.forEach((doc) => {
        const name = (doc.data().name ?? "") as string;
        setUsers((prev) => [...prev, name]);
      });
    };

    fetchData();
  }, []);

  const AddUser = async () => {
    await addDoc(collection(db, "users"), {
      name: "Innovation",
      age: 22,
    });
  }

  return <>
    <h1>Firebase prêt !</h1>
    <Button onClick={() =>AddUser()}>AddDoc</Button>
    {users.length}
    <ul>
      {users.map((user, index) => (
        <li key={index}>{user}</li>
      ))}
    </ul>
  </>
}

export default App;
