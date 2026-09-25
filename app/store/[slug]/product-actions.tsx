"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/common/ui";

export function ProductActions({ name }: { name: string }) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    try { setAdded(JSON.parse(localStorage.getItem("renest-product-shortlist") ?? "[]").includes(name)); } catch { /* Browsing works without storage. */ }
  }, [name]);
  function saveProduct() {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("renest-product-shortlist") ?? "[]");
      localStorage.setItem("renest-product-shortlist", JSON.stringify([...new Set([...saved, name])]));
      setAdded(true);
      setError(false);
    } catch { setError(true); }
  }
  return (
    <div className="store-actions">
      <Button type="button" icon={added ? Check : ShoppingBag} onClick={saveProduct}>{added ? "Saved to shortlist" : "Save to shortlist"}</Button>
      <span role="status">{error ? "Unable to save on this device. Please allow local storage." : added ? `${name} is saved on this device.` : "Demo collection · indicative prices and dimensions"}</span>
    </div>
  );
}
