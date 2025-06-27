import React from "react";
import { Media } from "reactstrap";
import Link from "next/link";
import { Kit, Product } from "@/app/globalProvider";

type SearchItem = {
  id: string;
  name: string;
  img: string[];
  type: "product" | "kit";
  url: string;
};

type Props = {
  show: boolean;
  kits: Kit[];
  products: Product[];
};

export const SearchResults: React.FC<Props> = React.memo(({ show, kits, products }) => {
  if (!show) return null;

  const allItems: SearchItem[] = [
    ...kits.map((kit) => ({
      id: kit.id,
      name: kit.name,
      img: kit.img,
      type: "kit" as const,
      url: "/product-details/thumbnail-left",
    })),
    ...products.map((product) => ({
      id: product.id,
      name: product.name,
      img: product.img,
      type: "product" as const,
      url: `/product-details/${product.id}`,
    })),
  ];

  return (
    <div
      style={{
        background: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        position: "absolute",
        top: "100%",
        left: 0,
        width: "100%",
        zIndex: 999,
        maxHeight: "300px",
        overflowY: "auto",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      {allItems.length > 0 ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {allItems.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <Link
                href={
                  item.type === "kit"
                    ? `${item.url}?id=${item.id}`
                    : item.url
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "#333",
                  width: "100%",
                }}
              >
                <Media
                  src={item.img?.[0] || "/placeholder.jpg"}
                  alt={item.name}
                  style={{
                    width: 50,
                    height: 50,
                    objectFit: "cover",
                    borderRadius: "4px",
                    marginRight: "10px",
                  }}
                />
                <div>
                  <h6 style={{ margin: 0, fontSize: "14px" }}>{item.name}</h6>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#555",
                      backgroundColor: "#f1f1f1",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      marginLeft: "6px",
                    }}
                  >
                    {item.type.toUpperCase()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ textAlign: "center", padding: "10px", color: "#999" }}>
          No matching results found.
        </div>
      )}
    </div>
  );
});
