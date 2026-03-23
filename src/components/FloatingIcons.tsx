import { useEffect, useRef } from "react";

const ICON_COUNT = 30;
const ICON_SIZE = 80;
const REPULSION_RADIUS = 180;
const REPULSION_STRENGTH = 0.5;
const CURSOR_REPULSION_RADIUS = 200;
const CURSOR_REPULSION_STRENGTH = 0.75;
const DRIFT_SPEED = 0.15;
const EDGE_MARGIN = 10;
const TARGET_FPS = 60;
const TARGET_DT = 1000 / TARGET_FPS;
const ICON_SVGS = [
	"/calendar-1.svg",
	"/calendar-check.svg",
	"/calendar-days.svg",
	"/calendar-fold.svg",
	"/calendar-plus-2.svg",
	"/calendar-range.svg",
	"/calendar-search.svg",
];

interface Icon {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rotation: number;
	rotationSpeed: number;
	imgIndex: number;
}

function createIcon(w: number, h: number): Icon {
	const angle = Math.random() * Math.PI * 2;
	return {
		x: Math.random() * (w - ICON_SIZE),
		y: Math.random() * (h - ICON_SIZE),
		vx: Math.cos(angle) * DRIFT_SPEED,
		vy: Math.sin(angle) * DRIFT_SPEED,
		rotation: Math.random() * 360,
		rotationSpeed: (Math.random() - 0.5) * 0.3,
		imgIndex: Math.floor(Math.random() * ICON_SVGS.length),
	};
}

/** Pre-rasterize an SVG into an offscreen canvas for fast drawImage calls */
function rasterizeSvg(img: HTMLImageElement): Promise<CanvasImageSource> {
	return new Promise((resolve) => {
		const draw = () => {
			const offscreen = document.createElement("canvas");
			offscreen.width = ICON_SIZE;
			offscreen.height = ICON_SIZE;
			offscreen.getContext("2d")!.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE);
			resolve(offscreen);
		};
		if (img.complete) draw();
		else img.onload = draw;
	});
}

export function FloatingIcons() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;

		let cancelled = false;
		const mouse = { x: -9999, y: -9999 };
		let icons: Icon[] = [];
		let rasterized: CanvasImageSource[] = [];

		// Load and pre-rasterize all SVG images
		const images = ICON_SVGS.map((src) => {
			const img = new Image();
			img.src = src;
			return img;
		});
		Promise.all(images.map(rasterizeSvg)).then((bitmaps) => {
			rasterized = bitmaps;
		});

		// Size canvas to window
		function resize() {
			canvas!.width = window.innerWidth;
			canvas!.height = window.innerHeight;
		}
		resize();
		window.addEventListener("resize", resize);

		// Track mouse
		function onMouseMove(e: MouseEvent) {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		}
		window.addEventListener("mousemove", onMouseMove);

		// Init icons
		for (let i = 0; i < ICON_COUNT; i++) {
			icons.push(createIcon(canvas.width, canvas.height));
		}

		let lastTime = 0;

		function animate(now: number) {
			if (cancelled) return;

			if (!lastTime) lastTime = now;
			const dt = Math.min(now - lastTime, 50) / TARGET_DT;
			lastTime = now;

			const vw = canvas!.width;
			const vh = canvas!.height;

			ctx.clearRect(0, 0, vw, vh);

			for (let i = 0; i < icons.length; i++) {
				const a = icons[i];

				// Icon-to-icon repulsion
				for (let j = i + 1; j < icons.length; j++) {
					const b = icons[j];
					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < REPULSION_RADIUS && dist > 0) {
						const force = (REPULSION_STRENGTH * (REPULSION_RADIUS - dist)) / REPULSION_RADIUS * dt;
						const fx = (dx / dist) * force;
						const fy = (dy / dist) * force;
						a.vx += fx;
						a.vy += fy;
						b.vx -= fx;
						b.vy -= fy;
					}
				}

				// Cursor repulsion
				const cx = a.x + ICON_SIZE / 2;
				const cy = a.y + ICON_SIZE / 2;
				const mdx = cx - mouse.x;
				const mdy = cy - mouse.y;
				const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

				if (mDist < CURSOR_REPULSION_RADIUS && mDist > 0) {
					const force = (CURSOR_REPULSION_STRENGTH * (CURSOR_REPULSION_RADIUS - mDist)) / CURSOR_REPULSION_RADIUS * dt;
					a.vx += (mdx / mDist) * force;
					a.vy += (mdy / mDist) * force;
				}

				// Dampen velocity
				const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
				if (speed > DRIFT_SPEED * 3) {
					const scale = (DRIFT_SPEED * 3) / speed;
					a.vx *= scale;
					a.vy *= scale;
				}

				// Update position
				a.x += a.vx * dt;
				a.y += a.vy * dt;
				a.rotation += a.rotationSpeed * dt;

				// Bounce off edges
				if (a.x < -EDGE_MARGIN) {
					a.x = -EDGE_MARGIN;
					a.vx = Math.abs(a.vx);
				} else if (a.x > vw - ICON_SIZE + EDGE_MARGIN) {
					a.x = vw - ICON_SIZE + EDGE_MARGIN;
					a.vx = -Math.abs(a.vx);
				}
				if (a.y < -EDGE_MARGIN) {
					a.y = -EDGE_MARGIN;
					a.vy = Math.abs(a.vy);
				} else if (a.y > vh - ICON_SIZE + EDGE_MARGIN) {
					a.y = vh - ICON_SIZE + EDGE_MARGIN;
					a.vy = -Math.abs(a.vy);
				}

				// Draw pre-rasterized bitmap
				const bitmap = rasterized[a.imgIndex];
				if (bitmap) {
					ctx.save();
					ctx.translate(a.x + ICON_SIZE / 2, a.y + ICON_SIZE / 2);
					ctx.rotate((a.rotation * Math.PI) / 180);
					ctx.drawImage(bitmap, -ICON_SIZE / 2, -ICON_SIZE / 2);
					ctx.restore();
				}
			}

			requestAnimationFrame(animate);
		}

		requestAnimationFrame(animate);

		return () => {
			cancelled = true;
			window.removeEventListener("resize", resize);
			window.removeEventListener("mousemove", onMouseMove);
		};
	}, []);

	return <canvas ref={canvasRef} className="floating-icons-container" />;
}
