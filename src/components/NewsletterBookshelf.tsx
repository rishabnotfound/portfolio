import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three-stdlib";
import * as THREE from "three";

export type NewsletterBookshelfItem = {
  id: string;
  title: string;
  date?: string;
  subtitle?: string;
  href?: string;
};

type BookProps = {
  item: NewsletterBookshelfItem;
  index: number;
  total: number;
  hoveredIndex: number | null;
  onHover?: (item: NewsletterBookshelfItem | null, index: number | null) => void;
  onSelect?: (item: NewsletterBookshelfItem) => void;
  hue: number;
};

const BOOK_W = 0.34;
const BOOK_H = 2.2;
const BOOK_D = 1.4;
const BOOK_GAP = 0.03;

function makeSpineTexture(title: string, date: string | undefined, hue: number) {
  const w = 192;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(w, 0, 0, 0);
  grad.addColorStop(0, `hsl(${hue}, 55%, 38%)`);
  grad.addColorStop(0.5, `hsl(${hue}, 50%, 28%)`);
  grad.addColorStop(1, `hsl(${hue}, 55%, 34%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = `hsla(${hue}, 70%, 82%, 0.5)`;
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = `hsla(${hue}, 70%, 82%, 0.2)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, w - 44, h - 44);

  // Text runs vertically along spine (bottom-to-top so it reads when head is tilted right)
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);

  ctx.fillStyle = "rgba(244, 239, 232, 0.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const clip = title.length > 22 ? title.slice(0, 21) + "…" : title;
  const upper = clip.toUpperCase();
  let fontSize = 96;
  ctx.font = `700 ${fontSize}px 'Space Grotesk', 'Inter', sans-serif`;
  while (ctx.measureText(upper).width > h - 140 && fontSize > 36) {
    fontSize -= 4;
    ctx.font = `700 ${fontSize}px 'Space Grotesk', 'Inter', sans-serif`;
  }
  ctx.fillText(upper, 0, -6);

  if (date) {
    ctx.font = "500 30px 'Space Grotesk', 'Inter', sans-serif";
    ctx.fillStyle = "rgba(244, 239, 232, 0.6)";
    ctx.fillText(date, 0, fontSize / 2 + 28);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function Book({ item, index, total, hoveredIndex, onHover, onSelect, hue }: BookProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);

  const spacing = BOOK_W + BOOK_GAP;
  const totalWidth = total * spacing;
  const x = index * spacing - totalWidth / 2 + spacing / 2;
  const hovered = hoveredIndex === index;

  const spineTex = useMemo(
    () => makeSpineTexture(item.title, item.date, hue),
    [item.title, item.date, hue]
  );

  const geo = useMemo(() => new RoundedBoxGeometry(BOOK_W, BOOK_H, BOOK_D, 4, 0.03), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => spineTex.dispose(), [spineTex]);

  const materials = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${hue}, 40%, 26%)`), roughness: 0.78 });
    const top = new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${hue}, 30%, 18%)`), roughness: 0.85 });
    const pages = new THREE.MeshStandardMaterial({ color: "#e8dfd0", roughness: 0.95 });
    const front = new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.6 });
    return [side, side, top, top, front, pages];
  }, [spineTex, hue]);

  const dist = hoveredIndex == null ? Infinity : Math.abs(index - hoveredIndex);
  const isNeighbor = dist === 1;

  const restY = BOOK_H / 2;
  const restZ = -BOOK_D / 2;

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return;

    const tipTarget = hovered ? -0.32 : 0;
    const yTarget = restY + (hovered ? 0.15 : 0);
    const zTarget = restZ + (hovered ? 0.3 : 0);
    const leanTarget = isNeighbor
      ? (index < (hoveredIndex ?? 0) ? 0.08 : -0.08)
      : 0;

    const g = groupRef.current;
    g.rotation.x += (tipTarget - g.rotation.x) * 0.12;
    g.position.y += (yTarget - g.position.y) * 0.14;
    g.position.z += (zTarget - g.position.z) * 0.14;

    const m = meshRef.current;
    m.rotation.z += (leanTarget - m.rotation.z) * 0.12;
  });

  // group placed so pivot is at top-back edge; mesh offset so its geometry origin
  // remains at book center relative to the group.
  return (
    <group
      ref={groupRef}
      position={[x, BOOK_H / 2, -BOOK_D / 2]}
    >
      <mesh
        ref={meshRef}
        geometry={geo}
        material={materials}
        position={[0, -BOOK_H / 2, BOOK_D / 2]}
        onPointerOver={(e) => { e.stopPropagation(); onHover?.(item, index); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHover?.(null, null); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); onSelect?.(item); }}
      />
    </group>
  );
}

function Shelf({ width }: { width: number }) {
  const thickness = 0.18;
  return (
    <mesh position={[0, -BOOK_H / 2 - thickness / 2, 0]} receiveShadow>
      <boxGeometry args={[width + 1.2, thickness, BOOK_D]} />
      <meshStandardMaterial color="#6b4526" roughness={0.85} />
    </mesh>
  );
}

function CameraFitter({ shelfWidth }: { shelfWidth: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const halfW = (shelfWidth + 1.2) / 2;                    // include shelf padding
    const halfH = BOOK_H / 2 + 0.3;
    const fov = (cam.fov * Math.PI) / 180;
    const distForH = halfH / Math.tan(fov / 2);
    const distForW = halfW / (Math.tan(fov / 2) * aspect);
    cam.position.z = Math.max(distForH, distForW) + BOOK_D / 2 + 0.2;
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, shelfWidth]);

  return null;
}

function Scene({ items, hoveredIndex, onHover, onSelect }: {
  items: NewsletterBookshelfItem[];
  hoveredIndex: number | null;
  onHover?: (item: NewsletterBookshelfItem | null, index: number | null) => void;
  onSelect?: (item: NewsletterBookshelfItem) => void;
}) {
  const width = items.length * (BOOK_W + BOOK_GAP);
  return (
    <>
      <CameraFitter shelfWidth={width} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 6]} intensity={1.3} castShadow />
      <directionalLight position={[-5, 2, 3]} intensity={0.7} color="#a0d8ff" />
      <directionalLight position={[0, -3, 4]} intensity={0.3} color="#ffb08a" />
      <Shelf width={width} />
      {items.map((it, i) => (
        <Book
          key={it.id}
          item={it}
          index={i}
          total={items.length}
          hoveredIndex={hoveredIndex}
          onHover={onHover}
          onSelect={onSelect}
          hue={(i * 47) % 360}
        />
      ))}
    </>
  );
}

type Props = {
  items: NewsletterBookshelfItem[];
  brand?: string;
  onSelect?: (item: NewsletterBookshelfItem) => void;
  className?: string;
};

export function NewsletterBookshelf({ items, brand, onSelect, className }: Props) {
  const [hovered, setHovered] = useState<NewsletterBookshelfItem | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleHover = (item: NewsletterBookshelfItem | null, i: number | null) => {
    cancelClose();
    if (item) {
      setHovered(item);
      setHoveredIndex(i);
    }
    // ignore null (pointer-out) — only replaced when another book is hovered
    // or when closeCard runs (mouseleave on the whole container)
  };

  const closeCard = () => {
    cancelClose();
    setHovered(null);
    setHoveredIndex(null);
  };

  // anchor card to the hovered book's x-position (books are evenly spaced across canvas center)
  const cardStyle: React.CSSProperties | undefined =
    hoveredIndex != null
      ? {
          left: `${((hoveredIndex + 0.5) / items.length) * 80 + 10}%`,
          top: "12px",
        }
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`pf-bookshelf ${className || ""}`}
      onMouseLeave={closeCard}
    >
      {brand && <div className="pf-bookshelf-brand">{brand}</div>}
      <div className="pf-bookshelf-canvas">
        <Canvas camera={{ position: [0, 0.3, 5], fov: 44 }} dpr={[1, 1.5]} shadows>
          <Scene items={items} hoveredIndex={hoveredIndex} onHover={handleHover} onSelect={onSelect} />
        </Canvas>
      </div>
      {hovered && (
        <div
          className="pf-bookshelf-detail"
          role="dialog"
          aria-label={hovered.title}
          style={cardStyle}
          onMouseEnter={cancelClose}
        >
          <div className="pf-bookshelf-detail-head">
            <span className="pf-bookshelf-detail-date">{hovered.date || "REPO"}</span>
          </div>
          <h3 className="pf-bookshelf-detail-title">{hovered.title}</h3>
          {hovered.subtitle && <p className="pf-bookshelf-detail-sub">{hovered.subtitle}</p>}
          {hovered.href && (
            <a href={hovered.href} target="_blank" rel="noreferrer" className="pf-bookshelf-detail-link" data-cursor-link>
              Open on GitHub →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default NewsletterBookshelf;
