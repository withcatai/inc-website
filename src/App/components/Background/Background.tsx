import {useLayoutEffect, useRef} from "react";
import {DisposeAggregator} from "lifecycle-utils";
import {isDarkThemeState} from "../../../utils/darkTheme.js";

import "./Background.css";

export function Background() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        if (canvasRef.current == null)
            return;

        const canvas = canvasRef.current;
        let circleFieldInstance: CircleFieldInstance | undefined = undefined;

        function resizeCanvas() {
            canvas.width = canvas.clientWidth * devicePixelRatio;
            canvas.height = canvas.clientHeight * devicePixelRatio;

            circleFieldInstance?.onResize();
        }

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas);

        resizeCanvas();

        try {
            circleFieldInstance = createCircleFieldBackground(canvas, {});
        } catch (err) {
            console.error("Failed to initialize circle field background:", err);
        }

        return () => {
            resizeObserver.disconnect();

            try {
                circleFieldInstance?.destroy();
            } catch (err) {
                console.error("Failed to destroy circle field background:", err);
            }
        };
    }, []);

    return <canvas ref={canvasRef} className="background" />;
}


type CircleFieldColors = {
    grayscaleMin: number,
    grayscaleMax: number,
    grayscaleAlpha: number,

    coloredHue: number, // 0–360
    coloredSaturation: number, // 0–100
    coloredLightMin: number, // 0–100
    coloredLightMax: number, // 0–100
    coloredAlpha: number // 0–1
};

type CircleFieldConfig = {
    animationSpeed: number,
    mouseGravityStrength: number,
    repulsionStrength: number,
    spreadFactor: number,

    coloredFraction: number,
    maxColoredRadius: number,
    coloredMinSeparationFactor: number,
    colorRepulsionMult: number,

    maxCircles: number,
    minRadius: number,
    maxRadius: number,
    baseDensity: number,

    colors: {
        light: CircleFieldColors,
        dark: CircleFieldColors
    }
};

type CircleFieldInstance = {
    destroy(): void,
    onResize(): void
};

type Circle = {
    x: number,
    y: number,
    radius: number,

    baseVelocityX: number,
    baseVelocityY: number,

    velocityX: number,
    velocityY: number,

    color: {
        light: string,
        dark: string
    },
    isColored: boolean
};

type MouseState = {
    x: number,
    y: number,
    active: boolean
};

export function createCircleFieldBackground(
    canvas: HTMLCanvasElement,
    userConfig: Partial<CircleFieldConfig>
): CircleFieldInstance {
    const ctx = canvas.getContext("2d");
    if (ctx == null)
        throw new Error("Canvas 2D context not available.");

    const renderingContext = ctx;

    const defaultColors: CircleFieldConfig["colors"] = {
        light: {
            grayscaleMin: 255 - 48 + 10,
            grayscaleMax: 255 - 16 + 10,
            grayscaleAlpha: 0.6,

            coloredHue: 220,
            coloredSaturation: 70,
            coloredLightMin: 55,
            coloredLightMax: 75,
            coloredAlpha: 0.4
        },
        dark: {
            grayscaleMin: 16,
            grayscaleMax: 48,
            grayscaleAlpha: 0.6,

            coloredHue: 220,
            coloredSaturation: 70,
            coloredLightMin: 55,
            coloredLightMax: 75,
            coloredAlpha: 0.32
        }
    };

    const config: CircleFieldConfig = {
        animationSpeed: 0.1,
        mouseGravityStrength: 0.0016,
        repulsionStrength: 0.02,
        spreadFactor: 1.6,

        coloredFraction: 0.35,
        maxColoredRadius: 4 * 3 + 10,
        coloredMinSeparationFactor: 2.4,
        colorRepulsionMult: 1.8,

        maxCircles: 90,
        minRadius: 4 * 3,
        maxRadius: 18 * 3,
        baseDensity: 24000,

        ...userConfig,
        colors: {
            ...defaultColors,
            light: {
                ...defaultColors.light,
                ...(userConfig.colors?.light ?? {})
            },
            dark: {
                ...defaultColors.dark,
                ...(userConfig.colors?.dark ?? {})
            }
        }
    };

    let canvasWidth = 0;
    let canvasHeight = 0;

    let circles: Circle[] = [];
    const mouseState: MouseState = {x: 0, y: 0, active: false};

    let animationFrameId: number | undefined = undefined;
    let destroyed = false;

    const MAX_PLACEMENT_ATTEMPTS = 2000;
    const EXTRA_SPAWN_PADDING = 6;

    function resizeCanvasToClientSize() {
        const previousWidth = canvasWidth || canvas.clientWidth || 1;
        const previousHeight = canvasHeight || canvas.clientHeight || 1;

        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;

        if (canvasWidth <= 0 || canvasHeight <= 0)
            return;

        const devicePixelRatioValue = window.devicePixelRatio || 1;

        const scaleX = canvasWidth / previousWidth;
        const scaleY = canvasHeight / previousHeight;

        for (const circle of circles) {
            circle.x *= scaleX;
            circle.y *= scaleY;
        }

        canvas.width = canvasWidth * devicePixelRatioValue;
        canvas.height = canvasHeight * devicePixelRatioValue;
        renderingContext.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
    }

    function generateColorFromSeed(isColored: boolean, seed: number, colors: CircleFieldColors): string {
        if (isColored) {
            const randomLightness = (
                colors.coloredLightMin + seed * (colors.coloredLightMax - colors.coloredLightMin)
            );

            return `hsla(${colors.coloredHue}, ${colors.coloredSaturation}%, ${randomLightness}%, ${colors.coloredAlpha})`;
        }

        const randomGrey = colors.grayscaleMin + (seed * (colors.grayscaleMax - colors.grayscaleMin));

        const g = Math.round(randomGrey);
        return `rgba(${g}, ${g}, ${g}, ${colors.grayscaleAlpha})`;
    }

    function generateCircleColor(isColored: boolean): {light: string, dark: string} {
        const seed = Math.random();

        return {
            light: generateColorFromSeed(isColored, seed, config.colors.light),
            dark: generateColorFromSeed(isColored, seed, config.colors.dark)
        };
    }

    function spawnCirclesInitially() {
        if (canvasWidth <= 0 || canvasHeight <= 0) resizeCanvasToClientSize();

        const maxCircleCount = Math.min(
            config.maxCircles,
            Math.max(20, Math.floor((canvasWidth * canvasHeight) / config.baseDensity))
        );

        circles = [];

        for (let i = 0; i < maxCircleCount; i++) {
            const radius = config.minRadius + (Math.random() * (config.maxRadius - config.minRadius));

            const speed = (0.05 + (Math.random() * 0.25)) * config.animationSpeed;

            const initialAngle = Math.random() * Math.PI * 2;

            const baseVelocityX = Math.cos(initialAngle) * speed;
            const baseVelocityY = Math.sin(initialAngle) * speed;

            const isColored = radius < config.maxColoredRadius && Math.random() < config.coloredFraction;

            let circleX = 0;
            let circleY = 0;
            let placedSuccessfully = false;

            for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
                circleX = radius + Math.random() * (canvasWidth - 2 * radius);
                circleY = radius + Math.random() * (canvasHeight - 2 * radius);

                let placementIsValid = true;

                for (const otherCircle of circles) {
                    const deltaX = circleX - otherCircle.x;
                    const deltaY = circleY - otherCircle.y;
                    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

                    const minRequiredDistance = radius + otherCircle.radius + EXTRA_SPAWN_PADDING;

                    if (distanceSquared < minRequiredDistance * minRequiredDistance) {
                        placementIsValid = false;
                        break;
                    }

                    if (isColored && otherCircle.isColored) {
                        const requiredColorDistance =
                            (radius + otherCircle.radius) * config.coloredMinSeparationFactor;

                        if (distanceSquared < requiredColorDistance * requiredColorDistance) {
                            placementIsValid = false;
                            break;
                        }
                    }
                }

                if (placementIsValid) {
                    placedSuccessfully = true;
                    break;
                }
            }

            if (!placedSuccessfully) {
                // fallback — place anywhere, repulsion will fix it later
                circleX = radius + Math.random() * (canvasWidth - 2 * radius);
                circleY = radius + Math.random() * (canvasHeight - 2 * radius);
            }

            circles.push({
                x: circleX,
                y: circleY,
                radius,

                baseVelocityX,
                baseVelocityY,

                velocityX: 0,
                velocityY: 0,

                isColored,
                color: generateCircleColor(isColored)
            });
        }
    }

    function updateCirclePhysics() {
        if (canvasWidth <= 0 || canvasHeight <= 0)
            return;

        const mouseAttractionRadius = 200;

        for (const circle of circles) {
            circle.velocityX = circle.baseVelocityX;
            circle.velocityY = circle.baseVelocityY;

            if (mouseState.active) {
                const deltaX = mouseState.x - circle.x;
                const deltaY = mouseState.y - circle.y;
                const distanceSquared = deltaX * deltaX + deltaY * deltaY;

                if (distanceSquared > 1 && distanceSquared < mouseAttractionRadius * mouseAttractionRadius) {
                    const distance = Math.sqrt(distanceSquared);
                    const attractionStrength = (1 - distance / mouseAttractionRadius) * config.mouseGravityStrength;

                    circle.velocityX += deltaX * attractionStrength;
                    circle.velocityY += deltaY * attractionStrength;
                }
            }
        }

        for (let i = 0; i < circles.length; i++) {
            const circleA = circles[i]!;

            for (let j = i + 1; j < circles.length; j++) {
                const circleB = circles[j]!;

                const deltaXBetweenCircles = circleB.x - circleA.x;
                const deltaYBetweenCircles = circleB.y - circleA.y;

                const distanceSquared = (
                    deltaXBetweenCircles * deltaXBetweenCircles +
                    deltaYBetweenCircles * deltaYBetweenCircles
                );

                if (distanceSquared <= 0)
                    continue;

                const summedRadii = circleA.radius + circleB.radius;
                const preferredSeparationDistance = summedRadii * config.spreadFactor;

                if (distanceSquared < preferredSeparationDistance * preferredSeparationDistance) {
                    const actualDistance = Math.sqrt(distanceSquared);

                    const unitX = deltaXBetweenCircles / actualDistance;
                    const unitY = deltaYBetweenCircles / actualDistance;

                    const overlapDistance = preferredSeparationDistance - actualDistance;
                    let repulsionForce = config.repulsionStrength * overlapDistance;

                    if (circleA.isColored && circleB.isColored)
                        repulsionForce *= config.colorRepulsionMult;

                    circleA.velocityX -= unitX * repulsionForce;
                    circleA.velocityY -= unitY * repulsionForce;

                    circleB.velocityX += unitX * repulsionForce;
                    circleB.velocityY += unitY * repulsionForce;
                }
            }
        }

        for (const circle of circles) {
            circle.x += circle.velocityX;
            circle.y += circle.velocityY;

            if (circle.x - circle.radius < 0) {
                circle.x = circle.radius;
                circle.baseVelocityX = Math.abs(circle.baseVelocityX);
            } else if (circle.x + circle.radius > canvasWidth) {
                circle.x = canvasWidth - circle.radius;
                circle.baseVelocityX = -Math.abs(circle.baseVelocityX);
            }

            if (circle.y - circle.radius < 0) {
                circle.y = circle.radius;
                circle.baseVelocityY = Math.abs(circle.baseVelocityY);
            } else if (circle.y + circle.radius > canvasHeight) {
                circle.y = canvasHeight - circle.radius;
                circle.baseVelocityY = -Math.abs(circle.baseVelocityY);
            }
        }
    }

    function renderCircles() {
        renderingContext.clearRect(0, 0, canvasWidth, canvasHeight);

        for (const circle of circles) {
            renderingContext.beginPath();
            renderingContext.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            renderingContext.fillStyle = isDarkThemeState.state
                ? circle.color.dark
                : circle.color.light;
            renderingContext.fill();
        }
    }

    function animationLoop() {
        if (destroyed)
            return;

        updateCirclePhysics();
        renderCircles();

        if (animationFrameId != null)
            cancelAnimationFrame(animationFrameId);

        animationFrameId = requestAnimationFrame(animationLoop);
    }

    function onMouseMove(event: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        mouseState.x = event.clientX - rect.left;
        mouseState.y = event.clientY - rect.top;
        mouseState.active = true;
    }

    function onMouseLeave() {
        mouseState.active = false;
    }

    const disposeAggregator = new DisposeAggregator();
    const destroy = () => {
        if (destroyed)
            return;

        destroyed = true;
        disposeAggregator.dispose();

        if (animationFrameId != null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = undefined;
        }

        circles = [];
    };

    window.addEventListener("mousemove", onMouseMove, {passive: true});
    window.addEventListener("mouseleave", onMouseLeave, {passive: true});
    disposeAggregator.add(() => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseleave", onMouseLeave);
    });

    resizeCanvasToClientSize();
    spawnCirclesInitially();
    animationLoop();

    disposeAggregator.add(isDarkThemeState.createChangeListener(renderCircles));


    return {
        destroy,
        onResize: resizeCanvasToClientSize
    };
}
