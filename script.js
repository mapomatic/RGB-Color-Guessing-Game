(function main() {
    'use strict';

    const canvas = document.getElementById('fireworkCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let disableClick = false;

    // Arrays to hold active fireworks, launch particles, and shatter pieces
    const fireworks = [];
    const launchParticles = [];
    const shatterPieces = [];

    // Define specific bright colors for the launched fireworks
    const brightColors = [
        { r: 255, g: 0, b: 0 }, // Bright red
        { r: 0, g: 0, b: 255 }, // Bright blue
        { r: 0, g: 255, b: 0 }, // Bright green
        { r: 255, g: 255, b: 0 }, // Bright yellow
        { r: 0, g: 255, b: 255 }, // Bright cyan
        { r: 255, g: 0, b: 255 }  // Bright magenta
    ];

    document.getElementById('fullscreenButton').addEventListener('click', () => {
        const elem = document.documentElement; // Fullscreen the entire page

        // Request fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
    });

    function updateCollisionBoxes() {
        colorBlocks = Array.from(document.querySelectorAll('.color-box')).map(box => {
            const rect = box.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            };
        });
    }

    // Event listeners to handle fullscreen changes
    document.addEventListener('fullscreenchange', toggleFullscreenButton);
    document.addEventListener('webkitfullscreenchange', toggleFullscreenButton);
    document.addEventListener('mozfullscreenchange', toggleFullscreenButton);
    document.addEventListener('msfullscreenchange', toggleFullscreenButton);

    function toggleFullscreenButton() {
        const fullscreenButton = document.getElementById('fullscreenButton');
        if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            fullscreenButton.style.display = 'none'; // Hide button in fullscreen mode
        } else {
            fullscreenButton.style.display = 'block'; // Show button when not in fullscreen mode
        }
    }

    // Get all color blocks for collision detection
    let colorBlocks = [];

    // Reference to the audio element
    const fireworkSound = document.getElementById('fireworkSound');

    // Generate random RGB color
    function getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return { r, g, b };
    }

    // Generate a random integer
    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    // Generate a bright variation of the base color
    function getBrightVariation(baseColor) {
        const minBrightness = 100; // Minimum brightness threshold to ensure colors are bright
        const variation = 50; // Brightness variation factor
        return {
            r: Math.max(minBrightness, Math.min(255, baseColor.r + Math.floor(Math.random() * variation) - variation / 2)),
            g: Math.max(minBrightness, Math.min(255, baseColor.g + Math.floor(Math.random() * variation) - variation / 2)),
            b: Math.max(minBrightness, Math.min(255, baseColor.b + Math.floor(Math.random() * variation) - variation / 2))
        };
    }

    // Set up the game
    function setupGame() {
        const color = getRandomColor();
        const colorToGuess = `rgb(${color.r}, ${color.g}, ${color.b})`;
        document.getElementById('rgbValue').textContent = colorToGuess.toUpperCase();

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';

        // Pick the correct choice index randomly
        const correctIndex = getRandomInt(3);

        // Create 3 color options
        for (let i = 0; i < 3; i++) {
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');

            // The correct color goes into the correct box
            let boxColor;
            if (i === correctIndex) {
                boxColor = color;
                colorBox.style.backgroundColor = colorToGuess;
                colorBox.dataset.correct = 'true';
            } else {
                boxColor = getRandomColor();
                colorBox.style.backgroundColor = `rgb(${boxColor.r}, ${boxColor.g}, ${boxColor.b})`;
            }   

            // Change this section to use a fixed dark gray color for the border:
            colorBox.style.boxShadow = 'inset 0px 0px 0px 3px rgba(100, 100, 100, 0.1), /* Light border */'
            + '\ninset 0px 0px 10px rgba(255, 255, 255, 1) /* Gradient effect for depth */';

            colorBox.addEventListener('click', function colorBoxClick() {
                checkAnswer(this);
            });

            choicesContainer.appendChild(colorBox);
        }

        // Update colorBlocks with the current color boxes positions
        updateCollisionBoxes();
    }

    // Play firework explosion sound with clones
    function playFireworkSound() {
        const soundClone = fireworkSound.cloneNode(); // Clone the audio element
        soundClone.play(); // Play the cloned sound
    }

    // Firework explosion effect with multicolor and fading particles
    function firework(x, y, singleColor = null, isGuessFirework = false) {
        const particles = [];
        const particleCount = 250; // Increase the number of particles
        const gravity = 0.05; // Gravity acceleration
        const explosionRadius = 6; // Larger explosion radius
        const fireworkColor = singleColor || getRandomColor(); // Use a single color or random colors

        playFireworkSound(); // Play the sound when a firework is triggered

        for (let i = 0; i < particleCount; i++) {
            const color = singleColor ? getBrightVariation(fireworkColor) : getRandomColor();
            const angle = Math.random() * Math.PI * 2; // Random angle for circular spread
            const speed = Math.random() * explosionRadius; // Random speed for spread radius
            const vx = Math.cos(angle) * speed; // Horizontal velocity based on angle
            const vy = Math.sin(angle) * speed; // Vertical velocity based on angle
            const elasticity = Math.random() * 0.5 + 0.5; // Random elasticity between 0.5 and 1.0
            const size = Math.random() * 2 + 1; // Random size between 1 and 3

            particles.push({
                x,
                y,
                vx,
                vy,
                color: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
                alpha: 1, // Start fully opaque
                life: Math.random() * 300 + 200, // Much longer lifespan
                maxLife: Math.random() * 300 + 200, // Total life for fading calculation
                gravity, // Add gravity effect
                elasticity, // Random elasticity effect for color blocks
                groundElasticity: 0.2, // Lower elasticity specifically for bouncing off the bottom of the screen
                bounceCount: 0, // Track the number of bounces
                size, // Random size for particles
                isGuessFirework // Add flag to differentiate
            });
        }

        fireworks.push(particles); // Add this firework to the list of active fireworks
    }

    // Check and handle collisions between particles and color blocks
    function handleCollision(particle) {
        colorBlocks.forEach((block, index) => {
            if (
                particle.x > block.x &&
                particle.x < block.x + block.width &&
                particle.y > block.y &&
                particle.y < block.y + block.height
            ) {
                const dxLeft = Math.abs(particle.x - block.x);
                const dxRight = Math.abs(particle.x - (block.x + block.width));
                const dyTop = Math.abs(particle.y - block.y);
                const dyBottom = Math.abs(particle.y - (block.y + block.height));
    
                const minDist = Math.min(dxLeft, dxRight, dyTop, dyBottom);
    
                if (minDist === dxLeft || minDist === dxRight) {
                    particle.vx *= -particle.elasticity; // Reverse horizontal velocity
                    particle.x += (minDist === dxLeft ? -1 : 1); // Prevent sticking by adjusting position
                } else {
                    particle.vy *= -particle.elasticity; // Reverse vertical velocity
                    particle.y += (minDist === dyTop ? -1 : 1); // Prevent sticking by adjusting position
                }
    
                particle.bounceCount++; // Increment bounce count
            }
        });
    }
    

    // Animate all fireworks and launch particles
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw each launch particle
        launchParticles.forEach((particle, index) => {
            const distanceToTarget = Math.sqrt((particle.targetX - particle.x) ** 2 + (particle.targetY - particle.y) ** 2);

            if (distanceToTarget < 5 || (particle.vx * (particle.targetX - particle.x) <= 0 && particle.vy * (particle.targetY - particle.y) <= 0)) {
                particle.callback(); // Trigger the explosion
                launchParticles.splice(index, 1); // Remove the particle
            } else {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2); // Draw the particle
                ctx.fill();

                // Update particle position
                particle.x += particle.vx;
                particle.y += particle.vy + particle.gravity * particle.frame;
                particle.frame++;
            }
        });

        // Iterate through all fireworks and animate them
        fireworks.forEach((particles, index) => {
            particles.forEach(particle => {
                if (particle.life > 0) {
                    // Different fade timing based on firework type
                    const fadeStart = particle.isGuessFirework ? particle.maxLife * 0.6 : particle.maxLife * 0.9; // Sooner fade for guess fireworks
                    const fadeEnd = particle.maxLife; // End of life
                    const fadeProgress = Math.max(0, (particle.life - fadeStart) / (fadeEnd - fadeStart));
                    particle.alpha = fadeProgress; // Alpha fades out based on firework type

                    ctx.fillStyle = `rgba(${
                        parseInt(particle.color.slice(5, 8), 10)}, ${
                        parseInt(particle.color.slice(10, 13), 10)}, ${
                        parseInt(particle.color.slice(15, 18), 10)}, ${
                        particle.alpha})`;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); // Draw particles with varying sizes
                    ctx.fill();

                    particle.vy += particle.gravity;
                    particle.x += particle.vx;
                    particle.y += particle.vy;

                    if (particle.y >= canvas.height) {
                        particle.y = canvas.height;
                        particle.vy *= -particle.groundElasticity * particle.elasticity;
                        particle.vx *= particle.elasticity;
                        particle.bounceCount++;
                    }

                    handleCollision(particle);
                    particle.life--;
                }
            });

            fireworks[index] = particles.filter(p => p.life > 0);
        });

        while (fireworks.length && fireworks[0].length === 0) {
            fireworks.shift();
        }

        // Animate shatter pieces
        animateShatterPieces();

        requestAnimationFrame(animate);
    }

    // Function to trigger multiple firework explosions at random positions
    function triggerMultipleFireworks() {
        const explosions = 6; // Number of explosions
        const interval = 100; // Interval in milliseconds between explosions
        for (let i = 0; i < explosions; i++) {
            setTimeout(() => {
                let x, y;
                do {
                    x = Math.random() * window.innerWidth;
                    y = Math.random() * (window.innerHeight / 2); // Top half of the screen
                } while (colorBlocks.some(block => x > block.x && x < block.x + block.width && y > block.y && y < block.y + block.height));

                const colorIndex = i % brightColors.length;
                const color = brightColors[colorIndex];

                // Pass the true flag for guess-triggered fireworks
                launchFirework(x, y, () => firework(x, y, color, true));
            }, i * interval);
        }
    }

    // Function to animate a small particle from the bottom center to the explosion point
    function launchFirework(x, y, callback) {
        const startX = window.innerWidth / 2; // Start from the bottom center of the screen
        const startY = window.innerHeight; // Bottom of the screen
        const speed = 12; // Set a faster constant speed for all launch particles
        const dx = x - startX;
        const dy = y - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed; // Horizontal velocity based on constant speed
        const vy = (dy / distance) * speed; // Vertical velocity based on constant speed
        const particle = {
            x: startX,
            y: startY,
            vx,
            vy,
            gravity: 0.005,
            callback,
            frame: 0,
            targetX: x, // Add target positions to check when to explode
            targetY: y
        };

        launchParticles.push(particle);
    }

    // Check if the selected answer is correct
    function checkAnswer(selectedBox) {
        if (disableClick) return;
        const isCorrect = selectedBox.dataset.correct === 'true';
        const message = document.getElementById('message');
    
        if (isCorrect) {
            message.textContent = 'Correct! You guessed the color!';
            message.style.color = 'green';
    
            // Trigger multiple fireworks at random positions in the top half of the screen
            triggerMultipleFireworks();
    
            // Fade all incorrect color blocks
            document.querySelectorAll('.color-box').forEach(box => {
                if (!box.dataset.correct) {
                    fadeBlock(box);
                }
            });
        } else {
            message.textContent = 'Wrong! Try again!';
            message.style.color = 'red';
    
            // Shatter all incorrect color blocks
            document.querySelectorAll('.color-box').forEach(box => {
                const rect = box.getBoundingClientRect();
                if (!box.dataset.correct) {
                    shatterBlock({
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                        color: window.getComputedStyle(box).backgroundColor
                    });
                    box.style.visibility = 'hidden'; // Hide the block after shattering
                }
            });
        }
    
        // Restart the game after a short delay
        disableClick = true;
        const timeoutLength = isCorrect ? 2000 : 2500;
        setTimeout(() => {
            disableClick = false;
            message.textContent = '';
            setupGame();
        }, timeoutLength);
    }
    
    
    

// Create shatter pieces for a wrong color block guess
function shatterBlock(block) {
    const pieces = [];
    const rows = 6; // Number of rows to split into
    const cols = 6; // Number of columns to split into
    const pieceWidth = block.width / cols; // Width of each piece
    const pieceHeight = block.height / rows; // Height of each piece
    const gravity = 0.3; // Gravity effect on the pieces

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = block.x + col * pieceWidth;
            const y = block.y + row * pieceHeight;
            const vx = (Math.random() - 0.5) * 1; // Random horizontal velocity
            const vy = Math.random() * -2; // Random upward velocity
            const rotationSpeed = (Math.random() - 0.5) * 0.2; // Random rotation speed

            // Determine which corner should be rounded
            let borderRadius = '0';
            if (row === 0 && col === 0) {
                borderRadius = '10px 0 0 0'; // Top-left corner rounded
            } else if (row === 0 && col === cols - 1) {
                borderRadius = '0 10px 0 0'; // Top-right corner rounded
            } else if (row === rows - 1 && col === 0) {
                borderRadius = '0 0 0 10px'; // Bottom-left corner rounded
            } else if (row === rows - 1 && col === cols - 1) {
                borderRadius = '0 0 10px 0'; // Bottom-right corner rounded
            }

            pieces.push({
                x,
                y,
                size: Math.min(pieceWidth, pieceHeight), // Use the smaller dimension for size
                vx,
                vy,
                gravity,
                rotation: 0,
                rotationSpeed,
                width: pieceWidth,
                height: pieceHeight,
                color: block.color,
                borderRadius // Add the borderRadius property
            });
        }
    }

    shatterPieces.push(...pieces);

    // Remove the shattered block's boundaries from the collision array
    colorBlocks = colorBlocks.filter(b => !(b.x === block.x && b.y === block.y && b.width === block.width && b.height === block.height));
}





// Animate shatter pieces
function animateShatterPieces() {
    shatterPieces.forEach((piece, index) => {
        piece.vy += piece.gravity; // Apply gravity
        piece.x += piece.vx; // Update horizontal position
        piece.y += piece.vy; // Update vertical position
        piece.rotation += piece.rotationSpeed; // Update rotation

        ctx.save();
        ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;

        ctx.beginPath();

        // Apply the correct rounded corner based on the piece's borderRadius property
        // Modify the radius to match the original blocks' rounding
const originalBlockRadius = 8; // Assume the original blocks have a radius of 5px; adjust this value if needed.

// Apply the correct rounded corner based on the piece's borderRadius property
if (piece.borderRadius === '10px 0 0 0') { // Top-left corner rounded
    ctx.moveTo(-piece.width / 2 + originalBlockRadius, -piece.height / 2);
    ctx.arcTo(-piece.width / 2, -piece.height / 2, -piece.width / 2, -piece.height / 2 + originalBlockRadius, originalBlockRadius);
    ctx.lineTo(-piece.width / 2, piece.height / 2);
    ctx.lineTo(piece.width / 2, piece.height / 2);
    ctx.lineTo(piece.width / 2, -piece.height / 2);
} else if (piece.borderRadius === '0 10px 0 0') { // Top-right corner rounded
    ctx.moveTo(-piece.width / 2, -piece.height / 2);
    ctx.lineTo(piece.width / 2 - originalBlockRadius, -piece.height / 2);
    ctx.arcTo(piece.width / 2, -piece.height / 2, piece.width / 2, -piece.height / 2 + originalBlockRadius, originalBlockRadius);
    ctx.lineTo(piece.width / 2, piece.height / 2);
    ctx.lineTo(-piece.width / 2, piece.height / 2);
} else if (piece.borderRadius === '0 0 0 10px') { // Bottom-left corner rounded
    ctx.moveTo(-piece.width / 2, -piece.height / 2);
    ctx.lineTo(piece.width / 2, -piece.height / 2);
    ctx.lineTo(piece.width / 2, piece.height / 2);
    ctx.lineTo(-piece.width / 2 + originalBlockRadius, piece.height / 2); // Use the original block's radius
    ctx.arcTo(-piece.width / 2, piece.height / 2, -piece.width / 2, piece.height / 2 - originalBlockRadius, originalBlockRadius);
} else if (piece.borderRadius === '0 0 10px 0') { // Bottom-right corner rounded
    ctx.moveTo(-piece.width / 2, -piece.height / 2);
    ctx.lineTo(piece.width / 2, -piece.height / 2);
    ctx.lineTo(piece.width / 2, piece.height / 2 - originalBlockRadius);
    ctx.arcTo(piece.width / 2, piece.height / 2, piece.width / 2 - originalBlockRadius, piece.height / 2, originalBlockRadius);
    ctx.lineTo(-piece.width / 2, piece.height / 2);
} else {
    // For pieces without any rounded corners
    ctx.rect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
}
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Remove pieces that have fallen off the screen
        if (piece.y - piece.height > canvas.height) {
            shatterPieces.splice(index, 1);
        }
    });
}




function fadeBlock(blockElement) {
    let opacity = 1;
    const targetOpacity = 0.5; // Target opacity for partial fade
    const fadeInterval = setInterval(() => {
        opacity -= 0.05; // Reduce opacity by 5% each frame
        if (opacity <= targetOpacity) {
            clearInterval(fadeInterval);
            blockElement.style.opacity = targetOpacity; // Set to target opacity when fade is complete
        } else {
            blockElement.style.opacity = opacity; // Apply the fade effect
        }
    }, 15); // Adjust the interval timing for smoother animation if needed
}



    // Start the game when the page loads
    setupGame();

    // Adjust canvas size on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateCollisionBoxes(); // Recalculate collision boxes positions on resize
    });

    // Firework effect anywhere on click, except on color boxes
    document.addEventListener('click', event => {
        if (!event.target.classList.contains('color-box') && event.target.id !== 'fullscreenButton') {
            firework(event.clientX, event.clientY); // No flag for click fireworks
        }
    });

    // Start animating all particles
    animate();
})();
