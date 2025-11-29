// src/TestApi.jsx
import { useEffect, useState } from "react";

export default function TestApi() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        console.log("RESPUESTA /api/products =>", json);
        setData(json);
      })
      .catch((err) => {
        console.error("Error en fetch /api/products:", err);
      });
  }, []);

  return (
    <pre className="p-4 text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
