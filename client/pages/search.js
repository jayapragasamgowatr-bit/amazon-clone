import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SearchPage() {

  const router = useRouter();

  const { q } = router.query;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [suggestion, setSuggestion] = useState("");

  // FETCH PRODUCTS
  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const res = await fetch(
          "http://localhost:5000/api/products?page=1"
        );

        const data = await res.json();

        setProducts(data.products || []);

      } catch (error) {

        console.log(error);

      }
    };

    fetchProducts();

  }, []);

  // SEARCH FILTER
  useEffect(() => {

    if (!q || products.length === 0) return;

    const results = products.filter((item) =>
      item.name.toLowerCase().includes(q.toLowerCase())
    );

    setFilteredProducts(results);

    // SIMPLE SPELLING SUGGESTION
    if (results.length === 0) {

      const similar = products.find((item) =>
        item.name
          .toLowerCase()
          .startsWith(q.toLowerCase().charAt(0))
      );

      if (similar) {
        setSuggestion(similar.name);
      }
    }

  }, [q, products]);

  return (

    <div className="min-h-screen bg-gray-100 p-10">

      {/* HEADER */}
<div className="flex justify-between items-center mb-10">

  <Link href="/">

    <h1 className="text-3xl font-bold cursor-pointer hover:text-yellow-400">

      Good Water

    </h1>

  </Link>

  <Link href="/">

    <button className="bg-black text-white px-5 py-2 rounded-lg">
      Home
    </button>

  </Link>

</div>
      {/* RESULTS */}
      {filteredProducts.length > 0 ? (

        <div className="grid grid-cols-4 gap-8">

          {filteredProducts.map((item) => (

            <Link
              href={`/product/${item._id}`}
              key={item._id}
            >

              <div className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:scale-105 transition">

                <img
                  src={item.image}
                  alt={item.name}
                  className="h-48 w-full object-cover rounded-lg"
                />

                <h2 className="text-xl font-bold mt-4">
                  {item.name}
                </h2>

                <p className="text-gray-500 mt-2">
                  {item.description}
                </p>

                <p className="text-green-600 font-bold text-xl mt-3">
                  ₹{item.price}
                </p>

              </div>

            </Link>

          ))}

        </div>

      ) : (

        <div className="bg-white p-10 rounded-xl shadow-lg text-center">

          <h2 className="text-3xl font-bold text-red-500">
            No Products Found
          </h2>

          {suggestion && (

            <div className="mt-6">

              <p className="text-lg">

                These are results for{" "}

                <span className="font-bold text-blue-600">
                  {suggestion}
                </span>

              </p>

              <p className="mt-2 text-gray-500">

                Search instead for{" "}

                <span className="font-bold">
                  {q}
                </span>

              </p>

              <Link href={`/search?q=${suggestion}`}>

                <button className="mt-5 bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-lg font-bold">
                  Show Similar Products
                </button>

              </Link>

            </div>

          )}

        </div>

      )}

    </div>
  );
}