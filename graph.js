/**
 * Graphing Module
 * Handles rendering of functions on HTML5 Canvas.
 */

let graphCanvas;
let ctx;
let width, height;
let scale = 40; // Pixels per unit
let offsetX = 0;
let offsetY = 0;
let currentFunction = null;
let isDragging = false;
let lastMouseX, lastMouseY;

const graphCalc = new Calculator(); // Separate instance for graphing

function initGraph() {
    graphCanvas = document.getElementById('graph-canvas');
    ctx = graphCanvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse Events for Panning
    graphCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            offsetX += dx;
            offsetY += dy;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            draw();
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Zoom with Wheel
    graphCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const delta = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(delta * zoomIntensity);

        // Zoom towards mouse pointer would be better, but center is easier for now
        scale *= zoom;
        draw();
    });

    // Plot Button
    document.getElementById('btn-plot').addEventListener('click', () => {
        const input = document.getElementById('graph-function').value;
        // Extract right side if user types "y = ..." or "f(x) = ..."
        let expr = input;
        if (expr.includes('=')) {
            expr = expr.split('=')[1];
        }
        currentFunction = expr.trim();
        draw();
    });

    // Initial draw
    draw();
}

function resizeCanvas() {
    if (!graphCanvas) return;
    const parent = graphCanvas.parentElement;
    graphCanvas.width = parent.clientWidth;
    graphCanvas.height = parent.clientHeight;
    width = graphCanvas.width;
    height = graphCanvas.height;
    draw();
}

function draw() {
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0f172a'; // Match bg
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    const startCol = Math.floor((-centerX) / scale);
    const endCol = Math.floor((width - centerX) / scale);

    for (let i = startCol; i <= endCol; i++) {
        const x = centerX + i * scale;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Horizontal lines
    const startRow = Math.floor((-centerY) / scale);
    const endRow = Math.floor((height - centerY) / scale);

    for (let i = startRow; i <= endRow; i++) {
        const y = centerY + i * scale;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Plot Function
    if (currentFunction) {
        ctx.strokeStyle = '#06b6d4'; // Cyan
        ctx.lineWidth = 3;
        ctx.beginPath();

        // Compile the expression once
        const compiledFn = graphCalc.compile(currentFunction);

        if (!compiledFn) {
            return;
        }

        let first = true;
        // Iterate over pixels across the screen
        for (let px = 0; px < width; px++) {
            // Convert pixel x to graph x
            const x = (px - centerX) / scale;

            try {
                // Evaluate using the compiled function with scope
                const y = compiledFn({ x: x });

                if (isNaN(y) || !isFinite(y)) {
                    first = true;
                    continue;
                }

                const py = centerY - y * scale;

                // Avoid drawing lines to infinity
                if (py < -height || py > height * 2) {
                    first = true;
                    continue;
                }

                if (first) {
                    ctx.moveTo(px, py);
                    first = false;
                } else {
                    ctx.lineTo(px, py);
                }
            } catch (e) {
                // Ignore errors during plotting
            }
        }
        ctx.stroke();
    }
}

// Expose init
window.initGraph = initGraph;
