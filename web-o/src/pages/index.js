import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Grocery Store</h1>
      <ul>
        {products.map(p => (
          <li key={p.id} className="mb-2 p-4 border rounded">
            <strong>{p.name}</strong> - ${p.price}
            <p>{p.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}