import { useEffect, useState } from "react";
import Link from "next/link";

export default function Users() {

  const [users, setUsers] = useState([]);

  useEffect(() => {

    const fetchUsers = async () => {

      try {

        const res = await fetch(
          "http://localhost:5000/api/auth/users"
        );

        const data = await res.json();

        setUsers(data);

      } catch (error) {

        console.log(error);

      }
    };

    fetchUsers();

  }, []);

  return (

    <div className="min-h-screen bg-gray-100 p-10">

      <div className="flex justify-between items-center mb-10">

        <Link href="/admin">

          <h1 className="text-3xl font-bold cursor-pointer hover:text-yellow-500">
            Good Water
          </h1>

        </Link>

        <h2 className="text-3xl font-bold">
          Manage Users
        </h2>

      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">

        {users.map((user) => (

          <div
            key={user._id}
            className="border-b py-4 flex justify-between"
          >

            <div>

              <h2 className="font-bold text-xl">
                {user.name}
              </h2>

              <p className="text-gray-500">
                {user.email}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}