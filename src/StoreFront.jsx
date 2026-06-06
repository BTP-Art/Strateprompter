import { useEffect, useState } from "react";

export default function Storefront() {
const [packs, setPacks] = useState([]);

useEffect(() => {
fetch("/SampleLibraries/index.json")
.then((res) => res.json())
.then((data) => setPacks(data.packs || []))
.catch((err) =>
console.error("Failed to load packs", err)
);
}, []);

return (
<div
style={{
padding: "24px",
maxWidth: "1400px",
margin: "0 auto"
}}
>
<h1
style={{
marginBottom: "8px"
}}
>
Starter Packs </h1>

```
  <p
    style={{
      opacity: 0.8,
      marginBottom: "24px"
    }}
  >
    Download sample libraries and import them into
    StratePrompter.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "20px"
    }}
  >
    {packs.map((pack) => (
      <div
        key={pack.id}
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#fff",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)"
        }}
      >
        {pack.thumbnail ? (
          <img
            src={pack.thumbnail}
            alt={pack.name}
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover"
            }}
          />
        ) : (
          <div
            style={{
              height: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f4f4f4",
              fontSize: "14px",
              opacity: 0.6
            }}
          >
            No Preview
          </div>
        )}

        <div
          style={{
            padding: "16px"
          }}
        >
          {pack.category && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                textTransform: "uppercase",
                opacity: 0.7,
                marginBottom: "6px"
              }}
            >
              {pack.category}
            </div>
          )}

          <h3
            style={{
              marginTop: 0,
              marginBottom: "8px"
            }}
          >
            {pack.name}
          </h3>

          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.5,
              minHeight: "56px"
            }}
          >
            {pack.description}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              fontSize: "12px",
              opacity: 0.75,
              marginBottom: "14px"
            }}
          >
           
            <span>
              v{pack.version || "1.0"}
            </span>
          </div>

          {pack.author && (
            <div
              style={{
                fontSize: "12px",
                marginBottom: "14px",
                opacity: 0.75
              }}
            >
              By {pack.author}
            </div>
          )}

          <a
            href={pack.file}
            download
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              background: "#2563eb",
              color: "white"
            }}
          >
            Download Pack
          </a>
        </div>
      </div>
    ))}
  </div>
</div>

);
}
