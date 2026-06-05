import React, { useEffect, useState } from "react";


export default function PerchancePromptGenerator() {
  const ui = {
  sectionGap: "16px",
  cardPadding: "10px",
  labelGap: "6px",
  inputGap: "10px",
  headingMargin: "0 0 12px 0",
  subheadingMargin: "0 0 10px 0"
};
  
  const [seed, setSeed] = useState("");
  const [guidance, setGuidance] = useState(8);
  const [guidanceEnabled, setGuidanceEnabled] = useState(true);

  const [fields, setFields] = useState([
  {
    id: crypto.randomUUID?.() ?? "init",
    title: "",
    text: "",
    weight: "1",
    collapsed: false,
    locked: false,
    tags: []
  }
]);

  const APP_VERSION = "0.9.0";
  const LIBRARY_SCHEMA_VERSION = 1;

  const [dragId, setDragId] = useState(null);

  const [library, setLibrary] = useState([]);
  const [search, setSearch] = useState("");
  const libraryCount = library.length;
  const nsfwCount = library.filter(i => i.nsfw).length;
  const favoriteCount = library.filter(i => i.favorite).length;
  const isLargeLibrary = libraryCount > 1000;

  const [saveTargetIndex, setSaveTargetIndex] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [saveTagsInput, setSaveTagsInput] = useState("");
  const [saveIsNSFW, setSaveIsNSFW] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

 const [pendingImportFile, setPendingImportFile] = useState(null);
const [showImportConfirm, setShowImportConfirm] = useState(false);

const [conflict, setConflict] = useState(null);

const [importQueue, setImportQueue] = useState([]);
const [importIndex, setImportIndex] = useState(0);
const [pendingAction, setPendingAction] = useState(null);
const isImporting =
  pendingAction === "import";

const importPercent =
  importQueue.length
    ? Math.round(
        (importIndex / importQueue.length) * 100
      )
    : 0;

const [hydrated, setHydrated] = useState(false);

const [settingsTab, setSettingsTab] = useState("behavior");

const normalizeLibrary = (items) =>
  items.map(normalizeLibraryItem);

const [settings, setSettings] = useState(() => {
  try {
  const saved =
    localStorage.getItem("app_settings");

  if (saved) {
    return JSON.parse(saved);
  }
} catch (err) {
  console.error(
    "Failed to load settings",
    err
  );
}

  return {
    behavior: {
      defaultWeight: "1",
      insertPosition: "bottom",
      autoCollapseOnLibraryInsert: false,
      restoreWorkspace: true,
      autoSaveWorkspace: true,
      confirmDeleteBlocks: true,
    },

    canvas: {
      includeSeed: true,
      includeGuidance: true,
    },

    library: {
  hideNSFW: true,

  searchTags: true,
  searchTitles: true,
  searchContent: true,
  searchAuthor: true,

  tagColors: []
},

    profile: {
      authorName: "",
    }
  };
});

const enqueueLibraryItems = (items) => {
  setImportQueue(items);
  setImportIndex(0);
  setPendingAction("import");
};

const getUniqueCopyName = (library, baseName) => {
  let candidate = `${baseName} (copy)`;

  if (!library.some(item => item.name === candidate)) {
    return candidate;
  }

  let count = 2;

  while (
    library.some(
      item => item.name === `${baseName} (copy ${count})`
    )
  ) {
    count++;
  }

  return `${baseName} (copy ${count})`;
};

useEffect(() => {
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.backgroundColor = "#e9ecf3";
  document.documentElement.style.height = "100%";
}, []);

useEffect(() => {
  if (!hydrated) return;

  if (!settings.behavior.restoreWorkspace) return;
  if (!settings.behavior.autoSaveWorkspace) return;

  const data = {
    seed,
    guidance,
    guidanceEnabled,
    fields
  };

  localStorage.setItem("workspace", JSON.stringify(data));
}, [
  seed,
  guidance,
  guidanceEnabled,
  fields,
  hydrated,
  settings.behavior.restoreWorkspace,
  settings.behavior.autoSaveWorkspace
]);

useEffect(() => {
  if (!pendingAction) return;
  if (importIndex >= importQueue.length) {
    setPendingAction(null);
    return;
  }

  const item = importQueue[importIndex];

  const conflict = findLibraryConflict(library, item);

  if (conflict) {
    setConflict(conflict);
    return; // PAUSE HERE
  }

  saveLibrary(prev => [...prev, item]);

  setImportIndex(i => i + 1);
}, [importIndex, importQueue, pendingAction, library]);

const requestAddToLibrary = (item) => {
  saveLibrary(prev => {
    const conflict = findLibraryConflict(prev, item);

    if (conflict) {
      setConflict(conflict);
      return prev; // stop here, wait for user decision
    }

    return [...prev, item];
  });
};

const findLibraryConflict = (library, item) => {
  const key = makeKey(item);
  const index = library.findIndex(x => makeKey(x) === key);

  if (index === -1) return null;

  return {
    index,
    existing: library[index],
    newItem: item
  };
};

const makeKey = (item) =>
  `${(item.name || "").trim().toLowerCase()}::${(item.text || "").trim()}`;


const handleUpdateLibrary = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
  try {
    const parsed = JSON.parse(
  e.target.result
);

const imported =
  Array.isArray(parsed)
    ? parsed
    : parsed.items || [];

    if (!Array.isArray(imported)) {
      alert("Invalid library file.");
      return;
    }

    const normalized = normalizeLibrary(imported);

      enqueueLibraryItems(normalized);

    } catch {
      alert("Failed to update library.");
    }
  };

  reader.readAsText(file);
};

  useEffect(() => {
  try {
    const saved =
      localStorage.getItem("prompt_library");

    if (saved) {
      setLibrary(JSON.parse(saved));
    }
  } catch (err) {
    console.error(
      "Failed to load prompt library",
      err
    );

    setLibrary([]);
  }
}, []);

  useEffect(() => {
  localStorage.setItem("authorName", settings.profile.authorName);
}, [settings.profile.authorName]);

  useEffect(() => {
  const savedSettings = JSON.parse(
    localStorage.getItem("app_settings") || "{}"
  );

  if (
    savedSettings?.behavior?.restoreWorkspace === false
  ) {
    setHydrated(true);
    return;
  }

  const saved = localStorage.getItem("workspace");

  if (!saved) {
    setHydrated(true);
    return;
  }

  try {
    const data = JSON.parse(saved);

    setSeed(data.seed || "");
    setGuidance(data.guidance ?? 8);
    setGuidanceEnabled(data.guidanceEnabled ?? true);

    if (
      Array.isArray(data.fields) &&
      data.fields.length > 0
    ) {
      setFields(data.fields);
    }
  } catch (err) {
    console.error("Workspace load failed", err);
  }

  setHydrated(true);
}, []);

  useEffect(() => {
  localStorage.setItem("app_settings", JSON.stringify(settings));
}, [settings]);

const collapseAll = () => {
  setFields(prev =>
    prev.map(field => ({
      ...field,
      collapsed: true
    }))
  );
};

const expandAll = () => {
  setFields(prev =>
    prev.map(field => ({
      ...field,
      collapsed: false
    }))
  );
};



const duplicateField = (index) => {
  const source = fields[index];

  setFields(prev => {
    const updated = [...prev];

    // base title
    let baseTitle = source.title?.trim() || "Block";

    // find next number for similar titles
    let count = 1;

    updated.forEach(f => {
      if (f.title?.startsWith(baseTitle)) {
        const match = f.title.match(/\((\d+)\)$/);
        if (match) {
          count = Math.max(count, Number(match[1]) + 1);
        } else if (f.title === baseTitle) {
          count = Math.max(count, 2);
        }
      }
    });

    const newItem = {
  ...source,

  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,

  sourceLibraryID: null,
  dirty: false,

  weight: settings.behavior.defaultWeight,
  title: `${baseTitle} (${count})`,
  locked: false,
  collapsed: false
};

    updated.splice(index + 1, 0, newItem);

    return updated;
  });
};

const getTagColor = (tag) => {
  const rules = settings.library.tagColors || [];

  const lowerTag = tag.toLowerCase();

  for (const rule of rules) {
    if ((rule.tags || []).map(t => t.toLowerCase()).includes(lowerTag)) {
      return rule.color;
    }
  }

  return null;
};

const saveLibrary = (updater) => {
  setLibrary(prev => {
    const next =
      typeof updater === "function"
        ? updater(prev)
        : updater;

    localStorage.setItem("prompt_library", JSON.stringify(next));
    return next;
  });
};

  const updateLibrary = (imported) => {
  saveLibrary(prev => [
    ...prev,
    ...imported
  ]);
};

  const addField = () => {
 const newField = {
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  title: "",
  text: "",
  weight: settings.behavior.defaultWeight,
  collapsed: false,
  locked: false,
  tags: [],
  nsfw:false
};

  setFields(prev =>
    settings.behavior.insertPosition === "top"
      ? [newField, ...prev]
      : [...prev, newField]
  );
};

const updateField = (i, key, value) => {
  const dirtyKeys = ["title", "text"];

  setFields(prev =>
    prev.map((field, index) =>
      index === i
        ? {
            ...field,
            [key]: value,
            ...(dirtyKeys.includes(key)
              ? { dirty: true }
              : {})
          }
        : field
    )
  );
};

  const toggleCollapse = (i) => {
  setFields(prev =>
    prev.map((field, index) =>
      index === i
        ? {
            ...field,
            collapsed: !field.collapsed
          }
        : field
    )
  );
};

  const toggleLock = (i) => {
  setFields(prev =>
    prev.map((field, index) =>
      index === i
        ? {
            ...field,
            locked: !field.locked
          }
        : field
    )
  );
};

const normalizeLibraryItem = (item) => ({
  id:
    item.id ??
    crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random()}`,

  name: item.name?.trim() || "Unnamed Item",

  text: item.text ?? "",

  tags: Array.isArray(item.tags)
    ? item.tags
    : item.tags
      ? String(item.tags)
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)
      : [],

  nsfw: !!item.nsfw,

  favorite: !!item.favorite,

  author: item.author ?? "Unknown",

  type: item.type ?? "style"
}); 

const deleteField = (id) => {
  const field = fields.find(f => f.id === id);
  if (!field) return;

  if (settings.behavior.confirmDeleteBlocks) {
    const ok = window.confirm("Delete this block?");
    if (!ok) return;
  }

  setFields(prev => prev.filter(f => f.id !== id));
};

  const handleDragStart = (id) => {
  const field = fields.find(f => f.id === id);
  if (field?.locked) return;
  setDragId(id);
};

const handleDrop = (dropId) => {
  if (!dragId) return;

  setFields(prev => {
    const fromIndex = prev.findIndex(f => f.id === dragId);
    const toIndex = prev.findIndex(f => f.id === dropId);

    if (fromIndex === -1 || toIndex === -1) return prev;

    const updated = [...prev];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    return updated;
  });

  setDragId(null);
};
  const handleDragOver = (e) => e.preventDefault();
  
  const openSaveModal = (i) => {
    setSaveTargetIndex(i);
    setSaveNameInput(fields[i]?.title?.trim() || "");
    setSaveTagsInput((fields[i]?.tags || []).join(", ")
  );
    setShowSaveModal(true);
    console.log("OPEN SAVE MODAL CLICKED", i);
    setSaveIsNSFW(fields[i]?.nsfw || false);
  };

  const openUpdateModal = (i) => {
    setSaveTargetIndex(i);
    setSaveNameInput(fields[i]?.title?.trim() || "");
    setSaveTagsInput((fields[i]?.tags || []).join(", ")
  );
    setShowUpdateModal(true);
    console.log("OPEN UPDATE MODAL CLICKED", i);
    setSaveIsNSFW(fields[i]?.nsfw || false)
  };

const confirmNewLibraryItem = () => {
  if (saveTargetIndex == null) return;

  const i = Number(saveTargetIndex);

  const newItem = {
    id: crypto.randomUUID?.() ?? Date.now() + Math.random(),
    name: saveNameInput?.trim() || "Untitled Block",
    text: fields[i].text,
    type: "style",
    nsfw: saveIsNSFW,
    favorite: false,
    author: settings.profile.authorName || "Unknown",
    tags: saveTagsInput
      ? saveTagsInput.split(",").map(t => t.trim()).filter(Boolean)
      : []
  };

  enqueueLibraryItems([newItem]);

  setFields(prev =>
    prev.map((f, idx) =>
      idx === i
        ? {
            ...f,
            sourceLibraryID: newItem.id,
            dirty: false
          }
        : f
    )
  );

  setShowSaveModal(false);
  setShowUpdateModal(false);
  setSaveTargetIndex(null);
  setSaveNameInput("");
  setSaveTagsInput("");
};

const confirmSaveAsLibraryItem = () => {
  if (saveTargetIndex == null) return;

  const i = Number(saveTargetIndex);

  const newItem = {
    id: crypto.randomUUID?.() ?? Date.now() + Math.random(),
    name: saveNameInput?.trim() || "Untitled Block",
    text: fields[i].text,
    type: "style",
    nsfw: saveIsNSFW,
    favorite: false,
    author: settings.profile.authorName || "Unknown",
    tags: saveTagsInput
      ? saveTagsInput
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)
      : []
  };

  enqueueLibraryItems([newItem]);

  setShowUpdateModal(false);
  setSaveTargetIndex(null);
  setSaveNameInput("");
  setSaveTagsInput("");
};

const confirmUpdateToLibrary = () => {
  if (saveTargetIndex == null) return;

  const i = Number(saveTargetIndex);
  const id = fields[i].sourceLibraryID;

const exists = library.some(
  item => item.id === id
);

if (!exists) {
  alert(
    "The original library item no longer exists."
  );
  return;
}

  // 1. Update library
  saveLibrary(prev =>
    prev.map(it =>
      it.id === id
        ? {
            ...it,
            name: saveNameInput?.trim() || "Untitled Block",
            text: fields[i].text,
            nsfw: saveIsNSFW,
            favorite: it.favorite,
            author: settings.profile.authorName || "Unknown",
            tags: saveTagsInput
              ? saveTagsInput.split(",").map(t => t.trim()).filter(Boolean)
              : []
          }
        : it
    )
  );

  setFields(prev =>
    prev.map((f, idx) =>
      idx === i
        ? {
            ...f,
            dirty: false
          }
        : f
    )
  );

  setShowUpdateModal(false);
  setSaveTargetIndex(null);
  setSaveNameInput("");
  setSaveTagsInput("");
};

  const confirmDeleteLibraryItem = () => {
  if (!deleteTarget) return;

  saveLibrary(prev =>
    prev.filter(item => item.id !== deleteTarget.id)
  );

  setDeleteTarget(null);
  setShowDeleteModal(false);
};

const openDeleteModal = (item) => {
  setDeleteTarget(item);
  setShowDeleteModal(true);
};

const toggleFavorite = (id) => {
  saveLibrary(prev =>
    prev.map(item =>
      item.id === id
        ? { ...item, favorite: !item.favorite }
        : item
    )
  );
};

const insertFromLibrary = (item) => {
  setFields(prev => {
const newField = {
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  sourceLibraryID: item.id,
  title: item.name || "Imported Block",
  text: item.text,
  weight: settings.behavior.defaultWeight,
  collapsed: settings.behavior.autoCollapseOnLibraryInsert,
  locked: false,
  tags: item.tags,
  nsfw: item.nsfw,
  dirty: false,
  favorite: item.favorite
};

  return settings.behavior.insertPosition === "top"
    ? [newField, ...prev]
    : [...prev, newField];
});

  setShowPreviewModal(false);
};

const openPreview = (item) => {
  setPreviewItem(item);
  setEditName(item.name || "");
  setEditText(item.text || "");
  setEditTags((item.tags || []).join(", "));
  setShowPreviewModal(true);
};

const resetPreviewState = () => {
  setPreviewItem(null);
  setEditName("");
  setEditText("");
  setEditTags("");
};

  const filteredLibrary = library
  .filter(item => {
    const q = (search || "").toLowerCase();

  const searchableParts = [];

if (settings.library.searchTags) {
  searchableParts.push(...(item.tags || []));
}

if (settings.library.searchTitles) {
  searchableParts.push(item.name || "");
}

if (settings.library.searchContent) {
  searchableParts.push(item.text || "");
}

if (settings.library.searchAuthor) {
  searchableParts.push(item.author || "");
}

const searchableText =
  searchableParts.join(" ").toLowerCase();

const phraseMatches = [
  ...q.matchAll(/"([^"]+)"/g)
];

const phrases = phraseMatches.map(
  match => match[1].toLowerCase()
);

const remainingSearch = q.replace(
  /"([^"]+)"/g,
  ""
);

const terms = remainingSearch
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean);

const includeTerms = terms.filter(
  term => !term.startsWith("-")
);

const excludeTerms = terms
  .filter(term => term.startsWith("-"))
  .map(term => term.slice(1));

const matchesSearch =
  !q ||
  (
    phrases.every(phrase =>
      searchableText.includes(phrase)
    ) &&
    includeTerms.every(term =>
      searchableText.includes(term)
    ) &&
    excludeTerms.every(term =>
      !searchableText.includes(term)
    )
  );

    const isNSFW =
  item.nsfw === true ||
  (item.tags || []).some(t => t.toLowerCase() === "nsfw");

    if (settings.library.hideNSFW && isNSFW) return false;
    if (showFavoritesOnly && !item.favorite) return false;

    return matchesSearch;
  })
  .sort((a, b) => {
  if ((b.favorite || false) !== (a.favorite || false)) {
    return (b.favorite || false) - (a.favorite || false);
  }

  return a.name.localeCompare(
    b.name,
    undefined,
    { sensitivity: "base" }
  );
})


  const buildPrompt = () => {
    const body = fields
      .filter(f => f.text.trim())
      .map(f => `(\n${f.text.split("\n").join("\n")}\n:${f.weight}\n)`)
      .join("\n\n");

    const guidancePart =
  settings.canvas.includeGuidance && guidanceEnabled
    ? `(guidanceScale:::${guidance})`
    : "";

const seedPart =
  settings.canvas.includeSeed && seed
    ? `(seed:::${seed})`
    : "";

    return [body, guidancePart, seedPart].filter(Boolean).join("\n\n");
  };

  const exportLibrary = () => {
  const data = JSON.stringify(
  {
    schemaVersion:
      LIBRARY_SCHEMA_VERSION,

    items: library
  },
  null,
  2
);

  const blob = new Blob([data], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt-library.json";
  a.click();

  URL.revokeObjectURL(url);
};

const handleImportLibrarySelect = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setPendingImportFile(file);
  setShowImportConfirm(true);

  event.target.value = "";
};

const confirmImportLibrary = () => {
  if (!pendingImportFile) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(
  e.target.result
);

const imported =
  Array.isArray(parsed)
    ? parsed
    : parsed.items || [];

      if (!Array.isArray(imported)) {
        alert("Invalid library file.");
        return;
      }

      const normalized = normalizeLibrary(imported);

      saveLibrary(normalized);

      alert(
        `Library replaced.\n${normalized.length} items imported.`
      );

    } catch {
      alert("Failed to import library.");
    } finally {
      setPendingImportFile(null);
      setShowImportConfirm(false);
    }
  };

  reader.readAsText(pendingImportFile);
};
  
  const copy = () => {
    const text = buildPrompt();

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) return;
    } catch (err) {}

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const btn = "px-2 py-1 border rounded bg-white hover:bg-gray-100 text-xs";

  const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e5e5",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
};

const normalizeWeight = (v) => {
  const value = String(v).trim();

  if (/^\d+\.$/.test(value)) {
    return value.slice(0, -1) + ".0";
  }

  return value;
}; 

const savePreviewEdits = () => {
  if (!previewItem) return;

  saveLibrary(prev =>
    prev.map(it =>
      it.id === previewItem.id
        ? {
            ...it,
            name: editName?.trim() || "Unnamed Item",
            text: editText,
            tags: editTags
              .split(",")
              .map(t => t.trim())
              .filter(Boolean)
          }
        : it
    )
  );

  setShowPreviewModal(false);
  resetPreviewState();
};

  return (
  <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

    {/* HEADER */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#111",
      color: "white",
      padding: "10px 16px",
      borderRadius: "10px",
      margin: "10px"
    }}>
      <div style={{ fontWeight: "bold" }}>STRATEPROMPTER</div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => setShowSettingsModal(true)}>⚙</button>
        <button onClick={copy}>Copy</button>
      </div>
    </div>

    {/* GRID */}
    <div style={{
      display: "grid",
      gridTemplateColumns: "320px 1fr 380px",
      flex: 1,
      gap: "18px",
      padding: "18px",
      overflow: "hidden"
    }}>

      {/* LIBRARY */}
{/* LIBRARY OUTER */}
<div style={{
  backgroundColor: "#f7f7f9",
  border: "1px solid #ccc",
  borderRadius: "14px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  backdropFilter: "blur(6px)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}}>

  {/* STICKY HEADER */}
<div style={{
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backgroundColor: "#f7f7f9",
  padding: "18px",
  borderBottom: "1px solid #ddd",
  borderRadius: "14px"
}}>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px"
      }}
    >
      <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
        Library
      </h2>

    </div>

    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "10px"
        }}
      >
        <input
          type="checkbox"
          checked={showFavoritesOnly}
          onChange={e => setShowFavoritesOnly(e.target.checked)}
        />
        Favorites Only
      </label>
    </div>

    <div style={{ marginBottom: "12px" }}>
      <input
        className="border w-full p-1"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onDoubleClick={() => setSearch("")}
      />
    </div>

  </div>


        {saveStatus && <div className="text-xs text-green-600 mb-2">{saveStatus}</div>}
{/* SCROLL AREA */}
<div style={{
  flex: 1,
  overflowY: "auto",
  padding: "18px"
}}>
        {filteredLibrary.map(item => (
  <div key={item.id} style={card}>

    <div
  className="font-bold"
  style={{ marginBottom: "8px" }}
>
  {item.favorite && "★ "}
  {item.name}
</div>

   <div
  className="flex flex-wrap gap-2"
  style={{ marginBottom: "10px" }}
>
  {(item.tags || []).map((t, i) => {
    const color = getTagColor(t);

    return (
      <span
        key={i}
        className="border rounded text-[10px]"
        style={{
          padding: "3px 6px",
          cursor: "pointer",
          backgroundColor: color || "#f3f3f3",
          borderColor: color ? "transparent" : "#ddd",
          color: "#111"
        }}
        onClick={() => setSearch(t)}
      >
        {t}
      </span>
    );
  })}
</div>

    <div
      style={{
        borderTop: "1px solid #ececec",
        marginTop: "10px",
        paddingTop: "10px",
        display: "flex",
        gap: "8px"
      }}
    >
      <button className={btn} onClick={() => insertFromLibrary(item)}>
        Insert
      </button>

      <button className={btn} onClick={() => openDeleteModal(item)}>
  Delete
</button>

      <button className={btn} onClick={() => openPreview(item)}>
        Preview
      </button>

      <button
  className={btn}
  onClick={() => toggleFavorite(item.id)}
>
  {item.favorite ? "★" : "☆"}
</button>
    </div>

  </div>
))}
      </div>

      </div>

      {/* CENTER */}
      {/* Cavnass Outer */}
      <div style={{
  backgroundColor: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  backdropFilter: "blur(6px)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}}>

  {/* Sticky Header */}
        <div  style={{
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: "#f7f7f9",
    padding: "18px",
    borderBottom: "1px solid #ddd",
    borderRadius: "14px"
}}>
  <h2 style={{fontSize:"18px", fontWeight:"bold"}}>
    Canvas
  </h2>

  <div style={{ display: "flex", gap: "8px" }}>
    <button className={btn} onClick={expandAll}>
      Expand All
    </button>

    <button className={btn} onClick={collapseAll}>
      Collapse All
    </button>
  </div>

        <div className="mb-3">
  <label className="text-xs font-bold block mb-1">Seed</label>
  <input
    style={{ width: "100px"}}
    className="border"
    value={seed}
    onChange={e =>
      setSeed(e.target.value.replace(/\D/g, "").slice(0, 12))
    }
  />
</div>

        <div className="mb-3">
  <label className="text-xs font-bold mb-1">Guidance Scale</label>
</div>
<div>
  <input 
    style={{ width: "100px"}}
    className="border"
    value={guidance} 
    type="number" 
    onChange={e => setGuidance(Number(e.target.value))
    }            
  />
  <label className="text-xs">
  <input 
    type="checkbox" 
    checked={guidanceEnabled} 
    onChange={e => setGuidanceEnabled(e.target.checked)} /> Enable
  </label>
</div>
</div>
{/* SCROLL AREA */}
<div style={{
  flex: 1,
  overflowY: "auto",
  padding: "18px"
}}>
        {fields.map((f, i) => {
        
        const linkedLibraryItem = library.find(
  item => item.id === f.sourceLibraryID
);

const isLinked = !!linkedLibraryItem;
        const isDirty = f.dirty;

        return(
          <div
  style={{
    ...card,
    marginBottom: "16px"
  }}
            key={f.id}
            draggable={!f.locked}
            onDragStart={() => handleDragStart(f.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(f.id)}
          >

            {/* ALWAYS VISIBLE TITLE */}
            <input
              className="w-full border mb-1 text-xs font-bold"
              placeholder="Block Title"
              value={f.title}
              onChange={e => updateField(i, "title", e.target.value)}
            />

            {!f.collapsed && (
              <textarea
                rows={10}
                className="w-full border"
                value={f.text}
                onChange={e => updateField(i, "text", e.target.value)}
              />
            )}
<div className="mb-3">
  <label className="test-xs font-bold m-1">Weight</label>
</div>
  <input
  style={{ width: "39px" }}
  className="border"
  value={f.weight}
  onChange={e => updateField(i, "weight", e.target.value)}
  onBlur={e => {
  updateField(i, "weight", normalizeWeight(e.target.value));
}}
 />
 
            <div
      style={{
        borderTop: "1px solid #ececec",
        marginTop: "10px",
        paddingTop: "10px",
        display: "flex",
        gap: "8px"
      }}
    >
              {!isLinked && (
  <button onClick={() => openSaveModal(i)}>
    Save
  </button>
)}

{isLinked && !f.dirty && (
  <button disabled style={{ opacity: 0.4 }}>
    Update
  </button>
)}

{isLinked && f.dirty && (
  <button onClick={() => openUpdateModal(i)}>
    Update
  </button>
)}
              <button
  className={btn}
  onClick={() => duplicateField(i)}
>
  Duplicate
</button>
              <button className={btn} onClick={() => toggleCollapse(i)}>{f.collapsed ? "Expand" : "Collapse"}</button>
              <button className={btn} onClick={() => toggleLock(i)}>{f.locked ? "Unlock" : "Lock"}</button>
              <button className={btn} onClick={() => deleteField(f.id)}>Delete</button>
            </div>
          </div>
        )})}

        <button className="mt-2 px-3 py-1 bg-green-500 text-white rounded" onClick={addField}>Add Block</button>
      </div>
</div>
      {/* PREVIEW */}
      {/* PREVIEW OUTER */}
      <div style={{
  backgroundColor: "#f7f7f9",
  border: "1px solid #ccc",
  borderRadius: "14px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  backdropFilter: "blur(6px)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}}>
  {/* Sticky Header */}
        <div  style={{
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: "#f7f7f9",
    padding: "18px",
    borderBottom: "1px solid #ddd",
    borderRadius: "14px"
}}>
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  }}
>
        <h2 style={{fontSize:"18px", fontWeight:"bold", marginBottom:"12px"}}>
  Preview
</h2>
 
</div>
  
</div>
{/* SCROLL AREA */}
<div style={{
  flex: 1,
  overflow: "auto",
  padding: "18px"
}}>

        <pre className="text-xs whitespace-pre-wrap">{buildPrompt()}</pre>
      </div>
</div>
</div>

{/* SAVE MODAL */}
{showSaveModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        width: "400px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        Save Block
      </h3>

      <input
        style={{
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  marginBottom: "10px",
  padding: "8px"
}}
        value={saveNameInput}
        onChange={e => setSaveNameInput(e.target.value)}
        placeholder="Name"
      />

      <input
        style={{
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  marginBottom: "10px",
  padding: "8px"
}}
        value={saveTagsInput}
        onChange={e => setSaveTagsInput(e.target.value)}
        placeholder="Tags (comma separated)"
      />

      <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
  <input
    type="checkbox"
    checked={saveIsNSFW}
    onChange={e => setSaveIsNSFW(e.target.checked)}
  />
  NSFW
</label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button
          style={{
            padding: "6px 12px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer"
          }}
          onClick={() => setShowSaveModal(false)}
        >
          Cancel
        </button>

        <button
          style={{
            padding: "6px 12px",
            background: "#111",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
          onClick={confirmNewLibraryItem}
          
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

{/* Update MODAL */}
{showUpdateModal && (
  
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        width: "400px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        Update Item
      </h3>

      <input
        style={{
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  marginBottom: "10px",
  padding: "8px"
}}
        value={saveNameInput}
        onChange={e => setSaveNameInput(e.target.value)}
        placeholder="Name"
      />

      <input
        style={{
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  marginBottom: "10px",
  padding: "8px"
}}
        value={saveTagsInput}
        onChange={e => setSaveTagsInput(e.target.value)}
        placeholder="Tags (comma separated)"
      />

      <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
  <input
    type="checkbox"
    checked={saveIsNSFW}
    onChange={e => setSaveIsNSFW(e.target.checked)}
  />
  NSFW
</label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button
          style={{
            padding: "6px 12px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer"
          }}
          onClick={() => setShowUpdateModal(false)}
        >
          Cancel
        </button>

        <button
          style={{
            padding: "6px 12px",
            background: "#111",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
          onClick={confirmUpdateToLibrary}         
        >
          Update
        </button>

        <button
          style={{
            padding: "6px 12px",
            background: "#111",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
          onClick={confirmSaveAsLibraryItem}         
        >
          Save As
        </button>
      </div>
    </div>
  </div>
)}

      {/* PREVIEW MODAL */}
{showPreviewModal && previewItem && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        width: "500px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        Preview / Edit
      </h3>

      <input
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #ccc",
          marginBottom: "10px",
          padding: "8px"
        }}
        value={editName}
        onChange={e => setEditName(e.target.value)}
      />

      <textarea
        rows={10}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #ccc",
          marginBottom: "10px",
          padding: "8px"
        }}
        value={editText}
        onChange={e => setEditText(e.target.value)}
      />

      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          marginBottom: "4px"
        }}
      >
        Tags
      </div>

      <input
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #ccc",
          marginBottom: "14px",
          padding: "8px"
        }}
        value={editTags}
        onChange={e => setEditTags(e.target.value)}
      />

      <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
  <input
    type="checkbox"
    checked={previewItem?.nsfw || false}
    onChange={e => {
  const value = e.target.checked;

  setPreviewItem(prev => {
    if (!prev) return prev;

    const updated = { ...prev, nsfw: value };

    saveLibrary(items =>
      items.map(item =>
        item.id === updated.id
          ? { ...item, nsfw: value }
          : item
      )
    );

    return updated;
  });
}}
  />
  NSFW
</label>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px"
        }}
      >
        

        <button className={btn} onClick={savePreviewEdits}>
          Save
        </button>

        <button className={btn} onClick={() => insertFromLibrary(previewItem)}>
          Insert
        </button>

        <button className={btn} onClick={() => {
  setShowPreviewModal(false);
  resetPreviewState();
}}>
          Close
        </button>
      </div>
    </div>
  </div>
)}

    {/* DELETE MODAL */}
{showDeleteModal && deleteTarget && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        width: "360px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
    >
      <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        Delete Item?
      </h3>

      <p style={{ fontSize: "12px", marginBottom: "14px" }}>
        Are you sure you want to delete:
        <br />
        <strong>{deleteTarget.name}</strong>
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button
          className={btn}
          onClick={() => {
            setDeleteTarget(null);
            setShowDeleteModal(false);
          }}
        >
          Cancel
        </button>

        <button
          className={btn}
          style={{ background: "#b00020", color: "white" }}
          onClick={confirmDeleteLibraryItem}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

{/* SETTINGS MODAL */}
{showSettingsModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
    onClick={() => setShowSettingsModal(false)}
  >
    <div
      style={{
        backgroundColor: "white",
        width: "720px",
        height: "520px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        display: "flex",
        overflow: "hidden"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      
      
      {/* LEFT NAV */}
      <div
        style={{
          width: "180px",
          borderRight: "1px solid #ddd",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
          Settings
        </h3>

        <button className={btn} onClick={() => setSettingsTab("behavior")}>
  Behavior
</button>

<button className={btn} onClick={() => setSettingsTab("canvas")}>
  Canvas
</button>

<button className={btn} onClick={() => setSettingsTab("library")}>
  Library
</button>

<button className={btn} onClick={() => setSettingsTab("profile")}>
  Profile
</button>

<button className={btn} onClick={() => setSettingsTab("about")}>
  About
</button>

<button className={btn} onClick={() => setShowSettingsModal(false)}>
  Close
</button>

      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        
        <div>
  {settingsTab === "behavior" && (
  <div>
    <h3 style={{ margin: ui.headingMargin }}>Behavior</h3>

    {/* Canvas Defaults Card */}
    <div
  style={{
    marginBottom: ui.sectionGap,
    padding: ui.cardPadding,
    border: "1px solid #eee",
    borderRadius: "8px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: ui.labelGap
  }}
>
      <h4 style={{ margin: ui.subheadingMargin, fontWeight: "bold" }}>
  Canvas Defaults
</h4>

      {/* Default Weight */}
<label style={{ display: "block" }}>
  Default Weight
</label>

<input
  style={{ width: "40px" }}
  className="border"
  value={settings.behavior.defaultWeight}
  onChange={e => {
    const value = e.target.value;

    setSettings(prev => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        defaultWeight: value
      }
    }));
  }}
  onBlur={e => {
  setSettings(prev => ({
    ...prev,
    behavior: {
      ...prev.behavior,
      defaultWeight: normalizeWeight(e.target.value)
    }
  }));
}}
/>

      {/* Insert Position */}
      <label style={{ display: "block"}}>
        Insert Position
      </label>

      <select
        style={{ width: "80px"}}
        className="border"
        value={settings.behavior.insertPosition}
        onChange={e =>
  setSettings(prev => ({
    ...prev,
    behavior: {
      ...prev.behavior,
      insertPosition: e.target.value
    }
  }))
}
      >
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
      </select>

      {/* Auto Collapse */}
      <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={settings.behavior.autoCollapseOnLibraryInsert}
          onChange={e =>
  setSettings(prev => ({
    ...prev,
    behavior: {
      ...prev.behavior,
      autoCollapseOnLibraryInsert: e.target.checked
    }
  }))
}
        />
        Auto-collapse on insert
      </label>
    </div>
  </div>
)}

  {settingsTab === "canvas" && (
  <div>
    <h3 style={{ margin: ui.headingMargin }}>
      Canvas
    </h3>

    {/* Workspace Card */}
    <div
      style={{
        marginBottom: ui.sectionGap,
        padding: ui.cardPadding,
        border: "1px solid #eee",
        borderRadius: "8px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: ui.labelGap
      }}
    >
      <h4
        style={{
          margin: ui.subheadingMargin,
          fontWeight: "bold"
        }}
      >
        Workspace
      </h4>

      <label
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }}
      >
        <input
          type="checkbox"
          checked={settings.behavior.restoreWorkspace}
          onChange={e => {
  const enabled = e.target.checked;

  setSettings(prev => ({
    ...prev,
    behavior: {
      ...prev.behavior,
      restoreWorkspace: enabled,
      autoSaveWorkspace: enabled
        ? prev.behavior.autoSaveWorkspace
        : false
    }
  }));
}}
        />
        Restore workspace on startup
      </label>

      <label
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }}
      >
        <input
  type="checkbox"
  checked={settings.behavior.autoSaveWorkspace}
  disabled={!settings.behavior.restoreWorkspace}
  onChange={e =>
    setSettings(prev => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        autoSaveWorkspace: e.target.checked
      }
    }))
  }
/>
        Auto-save workspace
      </label>

      <label
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }}
      >
        <input
          type="checkbox"
          checked={settings.behavior.confirmDeleteBlocks}
          onChange={e =>
  setSettings(prev => ({
    ...prev,
    behavior: {
      ...prev.behavior,
      confirmDeleteBlocks: e.target.checked
    }
  }))
}
        />
        Confirm before deleting blocks
      </label>
    </div>

    {/* Preview Card */}
    <div
      style={{
        marginBottom: ui.sectionGap,
        padding: ui.cardPadding,
        border: "1px solid #eee",
        borderRadius: "8px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: ui.labelGap
      }}
    >
      <h4
        style={{
          margin: ui.subheadingMargin,
          fontWeight: "bold"
        }}
      >
        Preview
      </h4>

      <label
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }}
      >
        <input
          type="checkbox"
          checked={settings.canvas.includeSeed}
          onChange={e =>
  setSettings(prev => ({
    ...prev,
    canvas: {
      ...prev.canvas,
      includeSeed: e.target.checked
    }
  }))
}
        />
        Include Seed
      </label>

      <label
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }}
      >
        <input
          type="checkbox"
          checked={settings.canvas.includeGuidance}
          onChange={e =>
  setSettings(prev => ({
    ...prev,
    canvas: {
      ...prev.canvas,
      includeGuidance: e.target.checked
    }
  }))
}
        />
        Include Guidance
      </label>
    </div>
  </div>
)}

  {settingsTab === "library" && (
  <div>
    <h3 style={{ margin: ui.headingMargin }}>
      Library
    </h3>

{/* TAG COLOR CARD */}
    <div
  style={{
    marginBottom: ui.sectionGap,
    padding: ui.cardPadding,
    border: "1px solid #eee",
    borderRadius: "8px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: ui.labelGap
  }}
>
  <h4 style={{ margin: ui.subheadingMargin, fontWeight: "bold" }}>
    Tag Colors
  </h4>

  {(settings.library.tagColors || []).map((rule, index) => (
    <div
      key={rule.id}
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginBottom: "8px"
      }}
    >
      {/* Color Picker */}
      <input
        type="color"
        value={rule.color}
        onChange={e => {
          const value = e.target.value;

          setSettings(prev => {
            const updated = [...prev.library.tagColors];
            updated[index].color = value;

            return {
              ...prev,
              library: {
                ...prev.library,
                tagColors: updated
              }
            };
          });
        }}
      />

      {/* Tags Input */}
      <input
        style={{ flex: 1 }}
        className="border"
        value={(rule.tags || []).join(", ")}
        onChange={e => {
          const value = e.target.value;

          setSettings(prev => {
            const updated = [...prev.library.tagColors];

            updated[index].tags = value
              .split(",")
              .map(t => t.trim())
              .filter(Boolean);

            return {
              ...prev,
              library: {
                ...prev.library,
                tagColors: updated
              }
            };
          });
        }}
        placeholder="tags (comma separated)"
      />

      {/* Remove */}
      <button
        className={btn}
        onClick={() => {
          setSettings(prev => ({
            ...prev,
            library: {
              ...prev.library,
              tagColors: prev.library.tagColors.filter(
                (_, i) => i !== index
              )
            }
          }));
        }}
      >
        X
      </button>
    </div>
  ))}

  {/* Add Rule */}
  <button
    className={btn}
    onClick={() => {
      setSettings(prev => ({
        ...prev,
        library: {
          ...prev.library,
          tagColors: [
            ...(prev.library.tagColors || []),
            {
              id: crypto.randomUUID?.() ?? Date.now(),
              color: "#dddddd",
              tags: []
            }
          ]
        }
      }));
    }}
  >
    + Add Color Rule
  </button>
</div>
{/* SEARCH CONTROL CARD */}
<div
  style={{
    marginBottom: ui.sectionGap,
    padding: ui.cardPadding,
    border: "1px solid #eee",
    borderRadius: "8px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: ui.labelGap
  }}
>
  <h4
    style={{
      margin: ui.subheadingMargin,
      fontWeight: "bold"
    }}
  >
    Search Options
  </h4>

  <label>
    <input
      type="checkbox"
      checked={settings.library.searchTags}
      disabled={
        settings.library.searchTags &&
        !settings.library.searchTitles &&
        !settings.library.searchContent &&
        !settings.library.searchAuthor
      }
      onChange={e =>
        setSettings(prev => ({
          ...prev,
          library: {
            ...prev.library,
            searchTags: e.target.checked
          }
        }))
      }
    />
    Search Tags
  </label>

  <label>
    <input
      type="checkbox"
      checked={settings.library.searchTitles}
      disabled={
        settings.library.searchTitles &&
        !settings.library.searchTags &&
        !settings.library.searchContent &&
        !settings.library.searchAuthor
      }
      onChange={e =>
        setSettings(prev => ({
          ...prev,
          library: {
            ...prev.library,
            searchTitles: e.target.checked
          }
        }))
      }
    />
    Search Titles
  </label>

  <label>
    <input
      type="checkbox"
      checked={settings.library.searchContent}
      disabled={
        settings.library.searchContent &&
        !settings.library.searchTags &&
        !settings.library.searchTitles &&
        !settings.library.searchAuthor
      }
      onChange={e =>
        setSettings(prev => ({
          ...prev,
          library: {
            ...prev.library,
            searchContent: e.target.checked
          }
        }))
      }
    />
    Search Content
  </label>

  <label>
    <input
      type="checkbox"
      checked={settings.library.searchAuthor}
      disabled={
        settings.library.searchAuthor &&
        !settings.library.searchTags &&
        !settings.library.searchTitles &&
        !settings.library.searchContent
        
      }
      onChange={e =>
        setSettings(prev => ({
          ...prev,
          library: {
            ...prev.library,
            searchAuthor: e.target.checked
          }
        }))
      }
    />
    Search Author
  </label>

  <div
    style={{
      fontSize: "11px",
      color: "#666",
      marginTop: "4px"
    }}
  >
    At least one search source must remain enabled.
  </div>
</div>    
{/* NSFW Controls Card */}
    <div
      style={{
        marginBottom: ui.sectionGap,
        padding: ui.cardPadding,
        border: "1px solid #eee",
        borderRadius: "8px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: ui.labelGap
      }}
    >
      <h4
        style={{
          margin: ui.subheadingMargin,
          fontWeight: "bold"
        }}
      >
        NSFW Controls
      </h4>

      <label
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center"
        }}
      >
        <input
          type="checkbox"
          checked={settings.library.hideNSFW}
onChange={e =>
  setSettings(prev => ({
    ...prev,
    library: {
      ...prev.library,
      hideNSFW: e.target.checked
    }
  }))
}
        />
        Hide NSFW content
      </label>
    </div>




    {/* Library Management Card */}
    <div
      style={{
        marginBottom: ui.sectionGap,
        padding: ui.cardPadding,
        border: "1px solid #eee",
        borderRadius: "8px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: ui.labelGap
      }}
    >
      <h4
        style={{
          margin: ui.subheadingMargin,
          fontWeight: "bold"
        }}
      >
        Library Management
      </h4>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap"
        }}
      >
        
        <label
          className={btn}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          Add to Library

          <input
            type="file"
            accept=".json"
            onChange={handleUpdateLibrary}
            style={{ display: "none" }}
          />
        </label>

        <button
          className={btn}
          onClick={exportLibrary}
        >
          Export Library
        </button>

        <label
          className={btn}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          Replace Library

          <input
            type="file"
            accept=".json"
            onChange={handleImportLibrarySelect}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  </div>
)}

  {settingsTab === "profile" && (
  <div>
    <h3 style={{ margin: ui.headingMargin }}>
      User Profile
    </h3>

    <div
      style={{
        marginBottom: ui.sectionGap,
        padding: ui.cardPadding,
        border: "1px solid #eee",
        borderRadius: "8px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: ui.labelGap
      }}
    >
      <label style={{ display: "block" }}>
        Author Name
      </label>

      <input
        className="border"
        style={{ width: "200px" }}
        value={settings.profile.authorName}
        onChange={e =>
  setSettings(prev => ({
    ...prev,
    profile: {
      ...prev.profile,
      authorName: e.target.value
    }
  }))
}
        placeholder="e.g. BTP_Art"
      />
    </div>
  </div>
)}

{settingsTab === "about" && (
  <div>
    <h3 style={{ margin: ui.headingMargin }}>About</h3>

    <div
      style={{
        padding: ui.cardPadding,
        border: "1px solid #eee",
        borderRadius: "8px",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: ui.labelGap
      }}
    >
      <div>
        <strong>App:</strong> Strateprompter
      </div>

      <div>
        <strong>Author:</strong> BTP_Art
      </div>

      <div>
        <strong>Version:</strong> {APP_VERSION}
      </div>

      <div>
        <strong>Description:</strong> Structured generative AI text to image workspace tool for prompt building
      </div>

      <div>
        <strong>Library Count</strong> {libraryCount}
      </div>

    </div>
  </div>
)}
</div>

      </div>
    </div>
  </div>
)}

{/* IMPORT CONFIRM MODAL */}

{showImportConfirm && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
    onClick={() => setShowImportConfirm(false)}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        width: "420px",
        borderRadius: "10px"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ fontWeight: "bold", marginBottom: "12px" }}>
        Confirm Import
      </h3>

      <p style={{ fontSize: "13px", marginBottom: "16px" }}>
        This will replace <b>ALL</b> current library items. This action <b>CANNOT</b> be undone.  
        <br /><br />
        Do you wish to proceed?
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button className={btn} onClick={() => setShowImportConfirm(false)}>
          Cancel
        </button>

        <button className={btn} onClick={confirmImportLibrary}>
          Yes, Import
        </button>
      </div>
    </div>
  </div>
)}

{isImporting && !conflict && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99998
    }}
  >
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        width: "320px"
      }}
    >
      <h3>Importing Library</h3>

      <div>
        {importIndex} / {importQueue.length}
      </div>

      <div>
        {importPercent}%
      </div>
    </div>
  </div>
)}

{/* DUPLICATE ITEM MODAL */}

{conflict && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        width: "420px",
        borderRadius: "10px"
      }}
    >
      <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        Duplicate Detected
      </h3>

      <p style={{ fontSize: "12px", marginBottom: "10px" }}>
        This item already exists in your library.
      </p>

      <div style={{ fontSize: "11px", marginBottom: "12px" }}>
        <strong>Existing:</strong> {conflict.existing.name}
        <br />
        <strong>New:</strong> {conflict.newItem.name}
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          className={btn}
          onClick={() => {
            setConflict(null);
          }}
        >
          Cancel
        </button>

        <button
          className={btn}
          onClick={() => {
            setConflict(null);
setImportIndex(i => i + 1);
          }}
        >
          Skip
        </button>

        <button
          className={btn}
          onClick={() => {
            saveLibrary(prev => {
  const updated = [...prev];
  updated[conflict.index] = conflict.newItem;
  return updated;
});

setConflict(null);
setImportIndex(i => i + 1);
          }}
        >
          Overwrite
        </button>

        <button
          className={btn}
          onClick={() => {
            saveLibrary(prev => [
  ...prev,
  {
  ...conflict.newItem,
  id: crypto.randomUUID?.() ?? Date.now(),
  name: getUniqueCopyName(
    prev,
    conflict.newItem.name
  )
}
]);

setConflict(null);
setImportIndex(i => i + 1);
          }}
        >
          Keep Both
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
