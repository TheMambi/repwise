import { useEffect, useRef } from "react";

interface NeuralBackgroundProps {
    /**
     * Color of the particles.
     * Defaults to indigo if not specified.
     */
    color?: string;
    /**
     * The opacity of the trails (0.0 to 1.0).
     * Lower = longer trails. Higher = shorter trails.
     * Default: 0.15
     */
    trailOpacity?: number;
    /**
     * Number of particles. Default: 600
     */
    particleCount?: number;
    /**
     * Speed multiplier. Default: 1
     */
    speed?: number;
    /**
     * Holds the field still on the frame it has reached. Default: false
     */
    paused?: boolean;
}

// The field moves this many times a second on every display, so a 120 Hz screen does not run it at double speed.
const STEP_MS = 1000 / 60;
// How long the size has to stay put before the canvas is fitted to it.
const RESIZE_SETTLE_MS = 150;
// Phone browsers change the height by up to about this much each time their toolbars hide or show.
const TOOLBAR_HEIGHT = 150;

export default function NeuralBackground({
    color = "#6366f1", // Default Indigo
    trailOpacity = 0.15,
    particleCount = 600,
    speed = 1,
    paused = false,
}: NeuralBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // The loop below is set up once and keeps its particles. These let a change of `paused` reach it without a restart.
    const pausedRef = useRef(paused);
    const syncRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // --- CONFIGURATION ---
        let width = container.clientWidth;
        let height = container.clientHeight;
        const particles: Particle[] = [];
        // 0 while the loop is not running.
        let animationFrameId = 0;
        // True from the moment the canvas is sized until something is drawn on it.
        let blank = true;

        // --- PARTICLE CLASS ---
        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            age: number;
            life: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = 0;
                this.vy = 0;
                this.age = 0;
                // Random lifespan to create natural recycling
                this.life = Math.random() * 200 + 100;
            }

            update() {
                // 1. Flow Field Math (Simplex-ish noise)
                // We calculate an angle based on position to create the "flow"
                const angle = (Math.cos(this.x * 0.005) + Math.sin(this.y * 0.005)) * Math.PI;

                // 2. Add force from flow field
                this.vx += Math.cos(angle) * 0.2 * speed;
                this.vy += Math.sin(angle) * 0.2 * speed;

                // 3. Apply Velocity & Friction
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.95; // Friction to stop infinite acceleration
                this.vy *= 0.95;

                // 4. Aging
                this.age++;
                if (this.age > this.life) {
                    this.reset();
                }

                // 5. Wrap around screen
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = 0;
                this.vy = 0;
                this.age = 0;
                this.life = Math.random() * 200 + 100;
            }

            draw(context: CanvasRenderingContext2D) {
                context.fillStyle = color;
                // Fade in and out based on age
                const alpha = 1 - Math.abs((this.age / this.life) - 0.5) * 2;
                context.globalAlpha = alpha;
                context.fillRect(this.x, this.y, 1.5, 1.5); // Tiny dots are faster than arcs
            }
        }

        // --- INITIALIZATION ---
        // Sizes the drawing surface only. The canvas takes its size on screen from its classes,
        // so it stretches to cover the container until the surface is fitted again.
        const fitCanvas = () => {
            // Handle High-DPI screens (Retina)
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            blank = true;
        };

        // --- ANIMATION LOOP ---
        const step = () => {
            // "Fade" effect: Instead of clearing the canvas, we draw a semi-transparent rect
            // This creates the "Trails" look.
            // We use the background color of the parent or a dark overlay.
            // Assuming dark mode for this effect usually:
            ctx.fillStyle = `rgba(0, 0, 0, ${trailOpacity})`;
            ctx.fillRect(0, 0, width, height);

            particles.forEach((p) => {
                p.update();
                p.draw(ctx);
            });

            blank = false;
        };

        // Time of the previous frame, or null when the loop is starting or starting again.
        let lastFrame: number | null = null;
        // Time that has passed and not yet been turned into steps.
        let owed = 0;

        const animate = (now: number) => {
            // Steps follow the clock, not the frame count. The cap keeps a long gap from being replayed in one burst.
            owed = Math.min(owed + now - (lastFrame ?? now), STEP_MS * 3);
            lastFrame = now;
            // Half a millisecond of slack keeps a 60 Hz screen at one step a frame when frame times wobble.
            while (owed > STEP_MS - 0.5) {
                step();
                owed -= STEP_MS;
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        // Starts or stops the loop to match the `paused` prop and whether the tab is showing.
        const sync = () => {
            if (pausedRef.current || document.hidden) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
                if (blank && !document.hidden) {
                    // Paint the same field once as a still image instead of animating it.
                    for (let i = 0; i < 150; i++) step();
                }
            } else if (animationFrameId === 0) {
                lastFrame = null;
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        // --- EVENT LISTENERS ---
        let resizeTimer = 0;
        const handleResize = () => {
            // Dragging a window edge sends a stream of events. Fit the canvas once, after the last one.
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                // A small change in height alone is a phone toolbar sliding in or out. The stretched canvas covers it.
                if (newWidth === width && Math.abs(newHeight - height) < TOOLBAR_HEIGHT) return;
                width = newWidth;
                height = newHeight;
                fitCanvas();
                sync();
            }, RESIZE_SETTLE_MS);
        };

        // Start
        fitCanvas();
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        syncRef.current = sync;
        sync();

        window.addEventListener("resize", handleResize);
        document.addEventListener("visibilitychange", sync);

        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", sync);
            clearTimeout(resizeTimer);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, trailOpacity, particleCount, speed]);

    useEffect(() => {
        pausedRef.current = paused;
        syncRef.current?.();
    }, [paused]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
            <canvas ref={canvasRef} aria-hidden="true" className="block w-full h-full" />
        </div>
    );
}
