import { useEffect, useMemo, useRef, useState } from 'react';

type FurnitureType =
  | 'sofa'
  | 'table'
  | 'chair'
  | 'bed'
  | 'rug'
  | 'desk'
  | 'blocked'
  | 'custom';
type FurnitureShape = 'rect' | 'circle' | 'hexagon';

type FurnitureItem = {
  id: string;
  label: string;
  type: FurnitureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  shape: FurnitureShape;
};

type LayoutSnapshot = {
  room: { width: number; height: number };
  items: FurnitureItem[];
  selectedId: string | null;
  selectedIds: string[];
  showLabels: boolean;
  snap: boolean;
  createColor: string;
};

type SavedVersion = {
  id: string;
  name: string;
  savedAt: string;
  layout: LayoutSnapshot;
};

type PointerMode =
  | { mode: 'idle' }
  | { mode: 'drag'; id: string; offsetX: number; offsetY: number }
  | {
      mode: 'resize';
      id: string;
      edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
      startX: number;
      startY: number;
      startItem: Pick<FurnitureItem, 'x' | 'y' | 'width' | 'height'>;
    }
  | { mode: 'create'; id: string; startX: number; startY: number };

const COLOR_SWATCHES = [
  '#4f7cac',
  '#8a6d3b',
  '#a04a5b',
  '#607f61',
  '#9d7dd8',
  '#3f5f5f',
  '#7f868c',
  '#52585d',
  '#d17b4b',
  '#5c707a'
];
const SHAPES: Array<{ value: FurnitureShape; label: string }> = [
  { value: 'rect', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'hexagon', label: 'Hexagon' }
];

const DEFAULT_ROOM = {
  width: 11.5,
  height: 20.5
};

const DEFAULT_ITEMS: FurnitureItem[] = [
  {
    id: '1edef221-ee80-4609-8db7-c5aeba1829ca',
    type: 'sofa',
    label: 'Sofa',
    color: '#4f7cac',
    x: 7.25,
    y: 9,
    width: 3.25,
    height: 3.25,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'd00ce16c-edc9-4c1a-9559-86b293719cd6',
    type: 'sofa',
    label: 'TV',
    color: '#d17b4b',
    x: 0,
    y: 8.5,
    width: 2,
    height: 8,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'd8ad686d-c1ad-4e73-a7f2-04dceebaa493',
    type: 'sofa',
    label: 'Surfboards',
    color: '#607f61',
    x: 10.5,
    y: 9,
    width: 1,
    height: 9.75,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'a07d4244-9bea-4583-9ea1-1a46a00139cf',
    type: 'sofa',
    label: 'Sofa',
    color: '#4f7cac',
    x: 7.25,
    y: 12.25,
    width: 3.25,
    height: 3.25,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'fdfe2501-e6a6-4c25-bf9a-68f7c3e4ff4c',
    type: 'sofa',
    label: 'Sofa',
    color: '#4f7cac',
    x: 7.25,
    y: 15.5,
    width: 3.25,
    height: 3.25,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'babe8983-7444-458b-b9da-6a55282b8542',
    type: 'sofa',
    label: 'Sofa',
    color: '#4f7cac',
    x: 4,
    y: 12.25,
    width: 3.25,
    height: 3.25,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: '46ddce3e-c25d-4456-913b-a7479347ab3f',
    type: 'sofa',
    label: '',
    color: '#5c707a',
    x: 0,
    y: 1.5,
    width: 0.5,
    height: 4.25,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: '0bb3ef0a-2b4c-48ec-b117-73ca451fd438',
    label: '',
    type: 'blocked',
    x: 0,
    y: 17.5,
    width: 1.5,
    height: 3,
    rotation: 0,
    color: '#7f868c',
    shape: 'rect'
  },
  {
    id: 'f09f56e9-ac56-4409-98e5-9cc4f4b5c634',
    type: 'sofa',
    label: 'CPU',
    color: '#a04a5b',
    x: 0,
    y: 6.5,
    width: 2,
    height: 2,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'dc4a2e23-2941-4958-8845-59d2e0c3c7ae',
    type: 'custom',
    label: 'Speaker',
    color: '#a04a5b',
    x: 0,
    y: 16.5,
    width: 2,
    height: 1,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: '6371ccc5-1264-4b85-a8c2-4a1b575bec42',
    type: 'sofa',
    label: 'Chair',
    color: '#9d7dd8',
    x: 3.75,
    y: 3.5,
    width: 1.5,
    height: 1.5,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: '49b3685e-0acc-483f-a8a4-c08178fe9f09',
    type: 'custom',
    label: 'Table',
    color: '#9d7dd8',
    shape: 'rect',
    x: 5.5,
    y: 3,
    width: 5.25,
    height: 3.25,
    rotation: 0
  },
  {
    id: '465f3d2a-1f1f-4d06-bddf-4c797c33e914',
    type: 'sofa',
    label: 'Chair',
    color: '#9d7dd8',
    x: 8.75,
    y: 6.5,
    width: 1.5,
    height: 1.5,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'fd12d366-23a4-4933-a9d8-7ddf06be1236',
    type: 'sofa',
    label: 'Chair',
    color: '#9d7dd8',
    x: 6.25,
    y: 6.5,
    width: 1.5,
    height: 1.5,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: 'ef77938d-a46d-43c4-9177-fb8c1d5d43f1',
    type: 'sofa',
    label: 'Chair',
    color: '#9d7dd8',
    x: 7.5,
    y: 1.25,
    width: 1.5,
    height: 1.5,
    rotation: 0,
    shape: 'rect'
  },
  {
    id: '4f15f178-a42c-44ae-b370-c38e78aa20e1',
    type: 'custom',
    label: 'Surfboards',
    color: '#607f61',
    shape: 'rect',
    x: 8.75,
    y: 18.75,
    width: 2.75,
    height: 1.75,
    rotation: 0
  }
];
const DEFAULT_CREATE_COLOR = '#4f7cac';
const createDefaultItems = (): FurnitureItem[] =>
  DEFAULT_ITEMS.map((item) => ({ ...item }));
const INITIAL_ITEMS = createDefaultItems();

const GRID_UNIT = 0.25;
const MIN_SIZE = GRID_UNIT;
const MIN_CREATE_SIZE = GRID_UNIT;
const MIN_COMMIT_CREATE_SIZE = GRID_UNIT * 2;
const STORAGE_KEY = 'room-layout-studio:v2';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const snapToGrid = (value: number, unit = GRID_UNIT) =>
  Math.round(value / unit) * unit;
const snapDownToGrid = (value: number, unit = GRID_UNIT) =>
  Math.floor(value / unit) * unit;
const snapRotation = (value: number) => {
  const normalized = ((value % 360) + 360) % 360;
  return Math.round(normalized / 15) * 15 % 360;
};
const formatFeet = (value: number) => {
  const rounded = Math.round(value / GRID_UNIT) * GRID_UNIT;
  const whole = Math.round(rounded);
  if (Math.abs(rounded - whole) < 1e-9) {
    return String(whole);
  }
  const halves = Math.round(rounded * 2) / 2;
  if (Math.abs(rounded - halves) < 1e-9) {
    return rounded.toFixed(1);
  }
  return rounded.toFixed(2);
};
const shouldRotateNameToLongAxis = (item: FurnitureItem, scale: number) => {
  const widthPx = item.width * scale;
  const heightPx = item.height * scale;
  const estimatedTextWidthPx = Math.max(18, item.label.length * 6.8);
  const horizontalTooLong = estimatedTextWidthPx > widthPx - 8;
  const verticalHasRoom = estimatedTextWidthPx <= heightPx - 8;
  return horizontalTooLong && verticalHasRoom;
};
const normalizeShape = (value: unknown): FurnitureShape =>
  value === 'circle' || value === 'hexagon' ? value : 'rect';

function App() {
  const [roomWidth, setRoomWidth] = useState(DEFAULT_ROOM.width);
  const [roomHeight, setRoomHeight] = useState(DEFAULT_ROOM.height);
  const [roomWidthInput, setRoomWidthInput] = useState(String(DEFAULT_ROOM.width));
  const [roomHeightInput, setRoomHeightInput] = useState(String(DEFAULT_ROOM.height));
  const [items, setItems] = useState<FurnitureItem[]>(INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_ITEMS[0]?.id ?? null);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    INITIAL_ITEMS[0]?.id ? [INITIAL_ITEMS[0].id] : []
  );
  const [showLabels, setShowLabels] = useState(true);
  const [snap, setSnap] = useState(true);
  const [pointerMode, setPointerMode] = useState<PointerMode>({ mode: 'idle' });
  const [jsonDraft, setJsonDraft] = useState('');
  const [copiedItem, setCopiedItem] = useState<FurnitureItem | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 620 });
  const [isHydrated, setIsHydrated] = useState(false);
  const [createColor, setCreateColor] = useState(DEFAULT_CREATE_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [versionName, setVersionName] = useState('');

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const selectedIdsRef = useRef<string[]>(selectedIds);

  const layoutMetrics = useMemo(() => {
    const padding = 8;
    const scale = Math.min(
      Math.max(200, canvasSize.width - padding * 2) / roomWidth,
      Math.max(200, canvasSize.height - padding * 2) / roomHeight
    );
    const pxWidth = roomWidth * scale;
    const pxHeight = roomHeight * scale;

    return { scale, pxWidth, pxHeight };
  }, [canvasSize.height, canvasSize.width, roomWidth, roomHeight]);

  const activeSelectedId = selectedId ?? selectedIds[0] ?? null;
  const selectedItem = items.find((item) => item.id === activeSelectedId) ?? null;
  const currentSnapshot = (): LayoutSnapshot => ({
    room: { width: roomWidth, height: roomHeight },
    items,
    selectedId,
    selectedIds,
    showLabels,
    snap,
    createColor
  });
  const loadSnapshot = (snapshot: LayoutSnapshot) => {
    setRoomWidth(clamp(snapshot.room.width, 6, 40));
    setRoomHeight(clamp(snapshot.room.height, 6, 40));
    setItems(snapshot.items);
    setSelectedId(snapshot.selectedId ?? null);
    setSelectedIds(snapshot.selectedIds ?? []);
    setShowLabels(snapshot.showLabels);
    setSnap(snapshot.snap);
    setCreateColor(snapshot.createColor || DEFAULT_CREATE_COLOR);
  };

  useEffect(() => {
    selectedIdRef.current = selectedId;
    selectedIdsRef.current = selectedIds;
  }, [selectedId, selectedIds]);

  useEffect(() => {
    try {
      // Drop v1 so the new default profile takes effect after refresh.
      window.localStorage.removeItem('room-layout-studio:v1');
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as {
        room?: { width?: number; height?: number };
        items?: FurnitureItem[];
        selectedId?: string | null;
        selectedIds?: string[];
        showLabels?: boolean;
        snap?: boolean;
        createColor?: string;
        versions?: SavedVersion[];
      };
      if (parsed.room?.width && Number.isFinite(parsed.room.width)) {
        setRoomWidth(clamp(parsed.room.width, 6, 40));
      }
      if (parsed.room?.height && Number.isFinite(parsed.room.height)) {
        setRoomHeight(clamp(parsed.room.height, 6, 40));
      }
      if (Array.isArray(parsed.items)) {
        const hydratedItems = parsed.items.map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          rotation: snapRotation(item.rotation ?? 0),
          shape: normalizeShape(item.shape)
        }));
        setItems(hydratedItems);
        setSelectedId(null);
        setSelectedIds([]);
      }
      if (typeof parsed.showLabels === 'boolean') {
        setShowLabels(parsed.showLabels);
      }
      if (typeof parsed.snap === 'boolean') {
        setSnap(parsed.snap);
      }
      if (typeof parsed.createColor === 'string' && parsed.createColor.trim()) {
        setCreateColor(parsed.createColor);
      }
      if (Array.isArray(parsed.versions)) {
        setVersions(parsed.versions);
      }
    } catch {
      // Ignore malformed saved layout.
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const payload = {
      room: { width: roomWidth, height: roomHeight },
      items,
      selectedId,
      selectedIds,
      showLabels,
      snap,
      createColor,
      versions
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [createColor, isHydrated, items, roomHeight, roomWidth, selectedId, selectedIds, showLabels, snap, versions]);

  useEffect(() => {
    setRoomWidthInput(String(roomWidth));
  }, [roomWidth]);

  useEffect(() => {
    setRoomHeightInput(String(roomHeight));
  }, [roomHeight]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setCanvasSize((prev) => {
          const next = { width: Math.round(width), height: Math.round(height) };
          if (prev.width === next.width && prev.height === next.height) {
            return prev;
          }
          return next;
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toRoomCoordinates = (clientX: number, clientY: number) => {
    const roomEl = roomRef.current;
    if (!roomEl) {
      return null;
    }

    const rect = roomEl.getBoundingClientRect();
    const innerX = clientX - rect.left - roomEl.clientLeft;
    const innerY = clientY - rect.top - roomEl.clientTop;
    const x = clamp(innerX, 0, layoutMetrics.pxWidth) / layoutMetrics.scale;
    const y = clamp(innerY, 0, layoutMetrics.pxHeight) / layoutMetrics.scale;

    return { x, y };
  };

  const normalize = (value: number) => (snap ? snapToGrid(value) : value);
  const commitRoomWidth = () => {
    const parsed = Number(roomWidthInput);
    if (Number.isFinite(parsed)) {
      setRoomWidth(clamp(parsed, 6, 40));
    } else {
      setRoomWidthInput(String(roomWidth));
    }
  };
  const commitRoomHeight = () => {
    const parsed = Number(roomHeightInput);
    if (Number.isFinite(parsed)) {
      setRoomHeight(clamp(parsed, 6, 40));
    } else {
      setRoomHeightInput(String(roomHeight));
    }
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (pointerMode.mode === 'idle') {
        return;
      }

      const point = toRoomCoordinates(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      setItems((prevItems) => {
        if (pointerMode.mode === 'drag') {
          const dragged = prevItems.find((item) => item.id === pointerMode.id);
          if (!dragged) {
            return prevItems;
          }
          const nextX = clamp(normalize(point.x + pointerMode.offsetX), 0, roomWidth - dragged.width);
          const nextY = clamp(normalize(point.y + pointerMode.offsetY), 0, roomHeight - dragged.height);
          const selectedSet = new Set(selectedIds);

          if (!selectedSet.has(pointerMode.id) || selectedSet.size <= 1) {
            return prevItems.map((item) =>
              item.id === pointerMode.id ? { ...item, x: nextX, y: nextY } : item
            );
          }

          const selectedItems = prevItems.filter((item) => selectedSet.has(item.id));
          const minX = Math.min(...selectedItems.map((item) => item.x));
          const minY = Math.min(...selectedItems.map((item) => item.y));
          const maxRightGap = Math.min(
            ...selectedItems.map((item) => roomWidth - (item.x + item.width))
          );
          const maxBottomGap = Math.min(
            ...selectedItems.map((item) => roomHeight - (item.y + item.height))
          );
          const deltaX = clamp(nextX - dragged.x, -minX, maxRightGap);
          const deltaY = clamp(nextY - dragged.y, -minY, maxBottomGap);

          return prevItems.map((item) =>
            selectedSet.has(item.id) ? { ...item, x: item.x + deltaX, y: item.y + deltaY } : item
          );
        }

        return prevItems.map((item) => {
          if (item.id !== pointerMode.id) {
            return item;
          }

          if (pointerMode.mode === 'create') {
            const currentX = snap ? snapDownToGrid(point.x) : point.x;
            const currentY = snap ? snapDownToGrid(point.y) : point.y;
            const nextX = clamp(
              Math.min(pointerMode.startX, currentX),
              0,
              roomWidth - MIN_CREATE_SIZE
            );
            const nextY = clamp(
              Math.min(pointerMode.startY, currentY),
              0,
              roomHeight - MIN_CREATE_SIZE
            );
            const nextWidth = clamp(
              Math.abs(currentX - pointerMode.startX),
              MIN_CREATE_SIZE,
              roomWidth - nextX
            );
            const nextHeight = clamp(
              Math.abs(currentY - pointerMode.startY),
              MIN_CREATE_SIZE,
              roomHeight - nextY
            );
            return { ...item, x: nextX, y: nextY, width: nextWidth, height: nextHeight };
          }

          const deltaX = point.x - pointerMode.startX;
          const deltaY = point.y - pointerMode.startY;
          const start = pointerMode.startItem;

          if (pointerMode.edge === 'e' || pointerMode.edge === 'ne' || pointerMode.edge === 'se') {
            const width = clamp(
              normalize(start.width + deltaX),
              MIN_SIZE,
              roomWidth - start.x
            );
            item = { ...item, width };
          }

          if (pointerMode.edge === 's' || pointerMode.edge === 'se' || pointerMode.edge === 'sw') {
            const height = clamp(
              normalize(start.height + deltaY),
              MIN_SIZE,
              roomHeight - start.y
            );
            item = { ...item, height };
          }

          if (pointerMode.edge === 'w' || pointerMode.edge === 'nw' || pointerMode.edge === 'sw') {
            const rawX = start.x + deltaX;
            const x = clamp(normalize(rawX), 0, start.x + start.width - MIN_SIZE);
            const width = clamp(start.width + (start.x - x), MIN_SIZE, roomWidth - x);
            item = { ...item, x, width };
          }

          if (pointerMode.edge === 'n' || pointerMode.edge === 'ne' || pointerMode.edge === 'nw') {
            const rawY = start.y + deltaY;
            const y = clamp(normalize(rawY), 0, start.y + start.height - MIN_SIZE);
            const height = clamp(start.height + (start.y - y), MIN_SIZE, roomHeight - y);
            item = { ...item, y, height };
          }

          return item;
        });
      });
    };

    const onPointerUp = () => {
      if (pointerMode.mode === 'create') {
        setItems((prev) => {
          const created = prev.find((item) => item.id === pointerMode.id);
          if (!created) {
            return prev;
          }
          const tooSmall =
            created.width < MIN_COMMIT_CREATE_SIZE && created.height < MIN_COMMIT_CREATE_SIZE;
          if (!tooSmall) {
            return prev;
          }
          setSelectedId((current) => (current === created.id ? null : current));
          setSelectedIds((current) => current.filter((id) => id !== created.id));
          return prev.filter((item) => item.id !== created.id);
        });
      }
      setPointerMode({ mode: 'idle' });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [layoutMetrics.scale, pointerMode, roomHeight, roomWidth, selectedIds, snap]);

  const deleteSelected = () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : [];
    if (idsToDelete.length === 0) {
      return;
    }
    const deleteSet = new Set(idsToDelete);
    setItems((prev) => prev.filter((item) => !deleteSet.has(item.id)));
    setSelectedId(null);
    setSelectedIds([]);
  };

  const updateSelected = (patch: Partial<FurnitureItem>) => {
    const targetIds = selectedIds.length > 0 ? selectedIds : activeSelectedId ? [activeSelectedId] : [];
    if (targetIds.length === 0) {
      return;
    }
    const targetSet = new Set(targetIds);

    setItems((prev) =>
      prev.map((item) => (targetSet.has(item.id) ? { ...item, ...patch } : item))
    );
  };
  const commitRename = () => {
    if (!editingId) {
      return;
    }
    const label = editingLabel.trim();
    setItems((prev) =>
      prev.map((candidate) => (candidate.id === editingId ? { ...candidate, label } : candidate))
    );
    setEditingId(null);
    setEditingLabel('');
  };

  const copySelected = () => {
    if (!selectedItem || !activeSelectedId) {
      return;
    }
    setCopiedItem({ ...selectedItem, id: activeSelectedId });
  };

  const pasteCopied = () => {
    if (!copiedItem) {
      return;
    }
    const offset = GRID_UNIT;
    const x = clamp(copiedItem.x + offset, 0, roomWidth - copiedItem.width);
    const y = clamp(copiedItem.y + offset, 0, roomHeight - copiedItem.height);
    const clone: FurnitureItem = {
      ...copiedItem,
      id: crypto.randomUUID(),
      x: normalize(x),
      y: normalize(y)
    };
    setItems((prev) => [...prev, clone]);
    setSelectedId(clone.id);
    setSelectedIds([clone.id]);
  };

  const exportLayout = () => {
    const payload = {
      room: { width: roomWidth, height: roomHeight },
      items
    };
    setJsonDraft(JSON.stringify(payload, null, 2));
  };

  const importLayout = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as {
        room?: { width: number; height: number };
        items?: FurnitureItem[];
      };

      if (parsed.room) {
        setRoomWidth(clamp(parsed.room.width, 6, 40));
        setRoomHeight(clamp(parsed.room.height, 6, 40));
      }

      if (parsed.items && Array.isArray(parsed.items)) {
        const hydratedItems = parsed.items.map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          rotation: snapRotation(item.rotation ?? 0),
          shape: normalizeShape(item.shape)
        }));
        setItems(hydratedItems);
        setSelectedId(hydratedItems[0]?.id ?? null);
      }
    } catch {
      alert('Invalid JSON layout.');
    }
  };

  const resetToDefault = () => {
    const defaultItems = createDefaultItems();
    setRoomWidth(DEFAULT_ROOM.width);
    setRoomHeight(DEFAULT_ROOM.height);
    setRoomWidthInput(String(DEFAULT_ROOM.width));
    setRoomHeightInput(String(DEFAULT_ROOM.height));
    setItems(defaultItems);
    setSelectedId(null);
    setSelectedIds([]);
    setShowLabels(true);
    setSnap(true);
    setPointerMode({ mode: 'idle' });
    setJsonDraft('');
    setCopiedItem(null);
    setCreateColor(DEFAULT_CREATE_COLOR);
  };
  const saveNewVersion = () => {
    const name = versionName.trim() || `Version ${versions.length + 1}`;
    const entry: SavedVersion = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      layout: currentSnapshot()
    };
    setVersions((prev) => [entry, ...prev]);
    setSelectedVersionId(entry.id);
    setVersionName(entry.name);
  };
  const downloadLayoutJson = () => {
    const blob = new Blob([JSON.stringify(currentSnapshot(), null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `room-layout-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const updateSelectedVersion = () => {
    if (!selectedVersionId) {
      return;
    }
    const name = versionName.trim();
    setVersions((prev) =>
      prev.map((entry) =>
        entry.id === selectedVersionId
          ? {
              ...entry,
              name: name || entry.name,
              savedAt: new Date().toISOString(),
              layout: currentSnapshot()
            }
          : entry
      )
    );
  };
  const deleteSelectedVersion = () => {
    if (!selectedVersionId) {
      return;
    }
    setVersions((prev) => prev.filter((entry) => entry.id !== selectedVersionId));
    setSelectedVersionId('');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isDeleteKey =
        event.key === 'Backspace' ||
        event.key === 'Delete' ||
        event.code === 'Backspace' ||
        event.code === 'Delete';
      if (isDeleteKey) {
        const idsToDelete =
          selectedIds.length > 0
            ? selectedIds
            : selectedId
              ? [selectedId]
              : [];
        if (idsToDelete.length === 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const deleteSet = new Set(idsToDelete);
        setItems((prev) => prev.filter((item) => !deleteSet.has(item.id)));
        setSelectedId(null);
        setSelectedIds([]);
        return;
      }

      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (!isCmdOrCtrl || event.shiftKey || event.altKey) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'c') {
        event.preventDefault();
        copySelected();
      } else if (key === 'v') {
        event.preventDefault();
        pasteCopied();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [copiedItem, normalize, roomHeight, roomWidth, selectedId, selectedIds, selectedItem]);

  return (
    <div className="app">
      <div className="layout-grid">
        <aside className="panel">
          <h2>Room</h2>
          <label>
            Width (ft)
            <input
              type="text"
              inputMode="decimal"
              value={roomWidthInput}
              onChange={(event) => setRoomWidthInput(event.target.value)}
              onBlur={commitRoomWidth}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitRoomWidth();
                }
              }}
            />
          </label>
          <label>
            Height (ft)
            <input
              type="text"
              inputMode="decimal"
              value={roomHeightInput}
              onChange={(event) => setRoomHeightInput(event.target.value)}
              onBlur={commitRoomHeight}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitRoomHeight();
                }
              }}
            />
          </label>

          <div className="toggles">
            <label>
              <input
                type="checkbox"
                checked={snap}
                onChange={(event) => setSnap(event.target.checked)}
              />
              Snap to 0.25 ft grid
            </label>
            <label>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(event) => setShowLabels(event.target.checked)}
              />
              Show labels
            </label>
          </div>
          <button type="button" onClick={resetToDefault}>
            Reset to Default
          </button>

          <h2>Furniture</h2>
          <label>
            New object color
            <div className="swatches">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={`create-${color}`}
                  type="button"
                  className={`swatch ${createColor === color ? 'active' : ''}`}
                  aria-label={`Set new object color ${color}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCreateColor(color)}
                />
              ))}
            </div>
          </label>
          <div className="empty">
            Drag on the room to create a new object.
          </div>

          <h2>Selection</h2>
          {selectedItem ? (
            <div className="selection-fields">
              <label>
                Name
                <input
                  type="text"
                  value={selectedItem.label}
                  onChange={(event) => updateSelected({ label: event.target.value })}
                />
              </label>
              <label>
                Rotation ({Math.round(selectedItem.rotation)}°)
                <input
                  type="range"
                  min={0}
                  max={345}
                  step={15}
                  value={selectedItem.rotation}
                  onChange={(event) =>
                    updateSelected({ rotation: snapRotation(Number(event.target.value)) })
                  }
                />
              </label>
              <label>
                Color
                <div className="swatches">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`swatch ${selectedItem.color === color ? 'active' : ''}`}
                      aria-label={`Set color ${color}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateSelected({ color })}
                    />
                  ))}
                </div>
              </label>
              <label>
                Shape
                <div className="shape-options">
                  {SHAPES.map((shape) => (
                    <button
                      key={shape.value}
                      type="button"
                      className={selectedItem.shape === shape.value ? 'active-shape' : ''}
                      onClick={() => updateSelected({ shape: shape.value })}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </label>
              <button className="danger" onClick={deleteSelected}>
                Delete Item
              </button>
              <div className="json-actions">
                <button type="button" onClick={copySelected}>
                  Copy
                </button>
                <button type="button" onClick={pasteCopied} disabled={!copiedItem}>
                  Paste
                </button>
              </div>
            </div>
          ) : (
            <p className="empty">Select an item to edit it.</p>
          )}

          <h2>Layout JSON</h2>
          <div className="json-actions">
            <button onClick={exportLayout}>Export</button>
            <button onClick={importLayout}>Import</button>
          </div>
          <textarea
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            placeholder="Export a layout, tweak values, then import"
          />

          <h2>Saved Versions</h2>
          <label>
            Version Name
            <input
              type="text"
              value={versionName}
              onChange={(event) => setVersionName(event.target.value)}
              placeholder="Living room option A"
            />
          </label>
          <label>
            Version
            <select
              value={selectedVersionId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedVersionId(id);
                const found = versions.find((version) => version.id === id);
                if (found) {
                  setVersionName(found.name);
                  loadSnapshot(found.layout);
                }
              }}
            >
              <option value="">Select saved version</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name} ({new Date(version.savedAt).toLocaleString()})
                </option>
              ))}
            </select>
          </label>
          <div className="json-actions">
            <button type="button" onClick={saveNewVersion}>
              Save As
            </button>
            <button type="button" onClick={updateSelectedVersion} disabled={!selectedVersionId}>
              Save
            </button>
          </div>
          <div className="json-actions">
            <button type="button" onClick={downloadLayoutJson}>
              Export JSON
            </button>
            <button
              type="button"
              className="danger"
              onClick={deleteSelectedVersion}
              disabled={!selectedVersionId}
            >
              Delete
            </button>
          </div>
        </aside>

        <main className="canvas-panel">
          <div
            ref={canvasRef}
            className="room-shell"
            onPointerDownCapture={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('.furniture')) {
                return;
              }
              setSelectedId(null);
              setSelectedIds([]);
            }}
          >
            <div
              ref={roomRef}
              className={`room ${snap ? 'grid-on' : ''} draw-armed`}
              style={{
                width: layoutMetrics.pxWidth,
                height: layoutMetrics.pxHeight,
                ['--major-grid-size' as string]: `${layoutMetrics.scale}px`,
                ['--mid-grid-size' as string]: `${layoutMetrics.scale / 2}px`,
                ['--minor-grid-size' as string]: `${layoutMetrics.scale / 4}px`
              }}
              onPointerDown={(event) => {
                const point = toRoomCoordinates(event.clientX, event.clientY);
                if (!point) {
                  return;
                }
                event.preventDefault();
                const id = crypto.randomUUID();
                const startX = clamp(
                  snap ? snapDownToGrid(point.x) : point.x,
                  0,
                  roomWidth - MIN_CREATE_SIZE
                );
                const startY = clamp(
                  snap ? snapDownToGrid(point.y) : point.y,
                  0,
                  roomHeight - MIN_CREATE_SIZE
                );
                const newItem: FurnitureItem = {
                  id,
                  type: 'custom',
                  label: 'Item',
                  color: createColor,
                  shape: 'rect',
                  x: startX,
                  y: startY,
                  width: MIN_CREATE_SIZE,
                  height: MIN_CREATE_SIZE,
                  rotation: 0
                };
                setItems((prev) => [...prev, newItem]);
                setSelectedId(id);
                setSelectedIds([id]);
                setPointerMode({ mode: 'create', id, startX, startY });
              }}
            >
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const rotateMeta =
                  editingId !== item.id && shouldRotateNameToLongAxis(item, layoutMetrics.scale);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    className={`furniture ${item.type === 'blocked' ? 'unusable' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    style={{
                      left: item.x * layoutMetrics.scale,
                      top: item.y * layoutMetrics.scale,
                      width: item.width * layoutMetrics.scale,
                      height: item.height * layoutMetrics.scale,
                      transform: `rotate(${item.rotation}deg)`
                    }}
                    onPointerDown={(event) => {
                      const point = toRoomCoordinates(event.clientX, event.clientY);
                      if (!point) {
                        return;
                      }
                      event.preventDefault();
                      event.stopPropagation();
                      if (event.shiftKey) {
                        setSelectedIds((prev) => {
                          if (prev.includes(item.id)) {
                            const next = prev.filter((id) => id !== item.id);
                            setSelectedId((current) => (current === item.id ? next[0] ?? null : current));
                            return next;
                          }
                          const next = [...prev, item.id];
                          setSelectedId(item.id);
                          return next;
                        });
                        return;
                      }
                      const draggingMultiSelected =
                        selectedIds.includes(item.id) && selectedIds.length > 1;
                      if (draggingMultiSelected) {
                        setSelectedId(item.id);
                      } else {
                        setSelectedId(item.id);
                        setSelectedIds([item.id]);
                      }
                      setPointerMode({
                        mode: 'drag',
                        id: item.id,
                        offsetX: item.x - point.x,
                        offsetY: item.y - point.y
                      });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setSelectedId(item.id);
                        setSelectedIds([item.id]);
                      }
                    }}
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedId(item.id);
                      setSelectedIds([item.id]);
                      setEditingId(item.id);
                      setEditingLabel(item.label);
                    }}
                  >
                    <div
                      className={`item-shape item-shape-${item.shape}`}
                      style={{
                        backgroundColor: item.color,
                        backgroundImage:
                          item.type === 'blocked'
                            ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 8px, rgba(0,0,0,0.12) 8px 16px)'
                            : undefined
                      }}
                    />
                    <div className={`item-meta ${rotateMeta ? 'axis-vertical' : ''}`}>
                      {showLabels &&
                        (editingId === item.id ? (
                          <input
                            className="item-rename-input"
                            value={editingLabel}
                            autoFocus
                            onChange={(event) => setEditingLabel(event.target.value)}
                            onFocus={(event) => event.currentTarget.select()}
                            onBlur={commitRename}
                            onPointerDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                commitRename();
                              } else if (event.key === 'Escape') {
                                event.preventDefault();
                                setEditingId(null);
                                setEditingLabel('');
                              }
                            }}
                          />
                        ) : (
                          <span className="item-name">{item.label}</span>
                        ))}
                      <span className="item-size">
                        {formatFeet(item.width)} x {formatFeet(item.height)} ft
                      </span>
                    </div>

                    {isSelected && selectedId === item.id && (
                      <>
                        {(['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'] as const).map((edge) => (
                          <button
                            key={edge}
                            className={`resize-handle edge-${edge}`}
                            aria-label={`Resize ${edge} side`}
                            onPointerDown={(event) => {
                              const point = toRoomCoordinates(event.clientX, event.clientY);
                              if (!point) {
                                return;
                              }
                              event.preventDefault();
                              event.stopPropagation();
                              setPointerMode({
                                mode: 'resize',
                                id: item.id,
                                edge,
                                startX: point.x,
                                startY: point.y,
                                startItem: {
                                  x: item.x,
                                  y: item.y,
                                  width: item.width,
                                  height: item.height
                                }
                              });
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
