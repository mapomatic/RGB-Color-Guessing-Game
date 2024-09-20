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
        { r: 255, g: 0, b: 255 } // Bright magenta
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

            // Set the box shadow to match the color of the box for an outer glow effect
            const glowColor = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, 0.6)`; // Adjust opacity as needed
            colorBox.style.boxShadow = `
        0 0 15px ${glowColor},  /* Outer glow effect */
        0 0 25px ${glowColor}   /* Additional softer glow */
    `;

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
        colorBlocks.forEach(block => {
            if (
                particle.x > block.x
                && particle.x < block.x + block.width
                && particle.y > block.y
                && particle.y < block.y + block.height
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
                let x; let
                    y;
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

    // Function to show the "Click to Continue" button
    function showContinueButton() {
        const continueButton = document.createElement('button');
        continueButton.textContent = 'Continue';
        continueButton.id = 'continueButton';
        continueButton.classList.add('continue-button'); // Apply the CSS class

        document.body.appendChild(continueButton);

        continueButton.addEventListener('click', () => {
            document.body.removeChild(continueButton); // Remove button after click
            disableClick = false;
            message.textContent = '';
            setupGame();
        });
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
        const targetColor = '#333333'; // Dark gray color for the fade effect
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05; // Reduce opacity by 5% each frame
            if (opacity <= 0.5) { // Fade until opacity is 50%
                clearInterval(fadeInterval);
                blockElement.style.opacity = 0.5; // Set to 50% opacity when fade is complete
                blockElement.style.backgroundColor = targetColor; // Set the background color to dark gray
                blockElement.style.boxShadow = 'none'; // Remove the glow effect
            } else {
                blockElement.style.opacity = opacity; // Apply the fade effect
                // Adjust the glow opacity along with the block's fade
                blockElement.style.boxShadow = `0 0 15px rgba(255, 255, 255, ${opacity * 0.6}), 
                                                 0 0 25px rgba(255, 255, 255, ${opacity * 0.6})`; // Fading glow
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

    // Firework effect anywhere on click, except on color boxes and specific buttons
    document.addEventListener('click', event => {
    // Check if the click is not on a color box, the fullscreen button, or the continue button
        if (!event.target.classList.contains('color-box')
        && event.target.id !== 'fullscreenButton'
        && event.target.id !== 'continueButton') {
            firework(event.clientX, event.clientY); // No flag for click fireworks
        }
    });

    const winMessages = [
        'Nailed it! You’ve got the magic touch!',
        'Bingo! Right on the money!',
        'You hit the bullseye! Color master in the house!',
        'Color genius detected!',
        'Boom! Spot on, color wizard!',
        'Winner, winner, color... dinner?',
        'You guessed it, you legend!',
        'Yes! Color guessing champion!',
        'You’ve got the eye of a color detective!',
        'You’re on fire! Perfect guess!',
        "Did someone say 'Color Guru'? Oh wait, that's you!",
        'That’s how it’s done! Boom!',
        'You just cracked the color code!',
        'That’s the shade! You rock!',
        'Color mastery unlocked!',
        'You nailed it like a pro!',
        'You guessed it, Picasso!',
        'Spot on! Color guessing level: expert!',
        'Bam! Another one for the win!',
        'You’re like a color whisperer!',
        'Oh snap! You got it right!',
        'You called it like a boss!',
        'Holy hue! You guessed it!',
        'Give yourself a high five! Nailed it!',
        'Color connoisseur alert!',
        'Boom! Right on the color mark!',
        'It’s like you can see colors or something!',
        'Bravo! Right on target!',
        'Oh yeah, you’ve got this!',
        'You guessed it with style!',
        'That’s how you do it! Bullseye!',
        'Winner of the color Olympics!',
        'You’ve got the color radar!',
        'Yep, that’s the one! Genius!',
        'Your color-guessing skills are next level!',
        'You guessed that like a pro!',
        'That’s the hue, and you knew!',
        'Crushed it! Color guessing extraordinaire!',
        'Boom! Another perfect guess!',
        'Spot on! You’re a color sleuth!',
        'Color guessing hall of fame material!',
        'That’s it! You’ve got the magic palette!',
        'You guessed it right, paint whisperer!',
        'You’re officially a color clairvoyant!',
        'You’ve got the eyes of a color hawk!',
        'Shazam! Right on target!',
        'You’re a color prophet!',
        'You guessed the shade like a legend!',
        'High five, color magician!',
        'You’ve just achieved color mastery!'
    ];

    const loseMessages = [
        'Oops! Not quite the right shade. Give it another go!',
        'Close, but no rainbow! Try again!',
        'That’s a nope! Back to the drawing board!',
        'Whoops! Wrong color. Try your luck again!',
        'Almost, but not quite! Go for another round!',
        'Missed it by a shade! Try again!',
        'Nice try, but that’s a color misfire!',
        'Uh-oh! Wrong color. Don’t give up now!',
        'Swing and a miss! Try another hue!',
        'Not this time! Spin the color wheel again!',
        'Color malfunction! Give it another whirl!',
        'Oopsie! Wrong color vibes. Take a second shot!',
        'Close, but not colorful enough! Try again!',
        'That’s not it, but you’re getting warmer!',
        'Wrong shade! Let’s give it another shot!',
        'Oops! Color malfunction detected. Try again!',
        'Not quite! You’re on the right track though!',
        'Almost! Keep your eyes on the color prize!',
        'Uh-oh, wrong color combo! Have another go!',
        'Whoops! Color guess detour. Try again!',
        'Color miss! Don’t worry, try another guess!',
        'Not the right color, but you’re close!',
        'Wrong one, but I believe in you! Try again!',
        'That’s a no-go! Pick another color!',
        'Oops, that’s not it! You’ve got this!',
        'Color misfire! But hey, no worries, try again!',
        'Uh-oh! Off by a shade. Have another guess!',
        'Swing and a miss! Reload your color senses!',
        'Wrong guess, but don’t give up!',
        'Try again! The color gods aren’t impressed yet!',
        'Oops, color fail! Don’t worry, you got this next time!',
        'Nope! Your color compass needs recalibrating!',
        'That’s a miss! Back to the color wheel!',
        'Not this one! But hey, you’re one guess closer!',
        'Oh dear, color error! Better luck next guess!',
        'Whoops! Wrong shade. Try again!',
        'Missed it! Let’s try another guess!',
        'Nope, that’s not the one. Keep at it!',
        'Color mismatch! Don’t give up yet!',
        'That’s not it! Reload your color guessing!',
        'Oh no! Wrong color alert! Try again!',
        'No dice! Color guess fail. Spin the wheel again!',
        'Oops! Color code not cracked. Try again!',
        'Missed by a shade! Guess again!',
        'Nope, that’s not the hue! Try another!',
        'Wrong color! But hey, you’re close!',
        'Miss! The color was hiding from you. Try again!',
        'Whoops! Color confusion! Take another guess!',
        'Uh-oh! The color dodged your guess. Try again!',
        'Not this time! But you’re warming up!'
    ];

    let currentWinMessageIndex = 0;
    let currentLoseMessageIndex = 0;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function getNextWinMessageString() {
        const message = winMessages[currentWinMessageIndex];
        currentWinMessageIndex = (currentWinMessageIndex + 1) % winMessages.length; // Loop back to the beginning if at the end
        return message;
    }

    function getNextLoseMessageString() {
        const message = loseMessages[currentLoseMessageIndex];
        currentLoseMessageIndex = (currentLoseMessageIndex + 1) % loseMessages.length; // Loop back to the beginning if at the end
        return message;
    }

    shuffleArray(winMessages);
    shuffleArray(loseMessages);

    // Check if the selected answer is correct
    function checkAnswer(selectedBox) {
        if (disableClick) return;
        const isCorrect = selectedBox.dataset.correct === 'true';
        const message = document.getElementById('message');

        if (isCorrect) {
            message.textContent = getNextWinMessageString(); // Use a random win message
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
            message.textContent = getNextLoseMessageString();
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

        // Show "Click to Continue" button instead of a timeout
        disableClick = true;
        showContinueButton();
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Select the elements
        const title = document.querySelector('h1'); // Select the game title
        const instructions = document.querySelector('p'); // Select the instruction line

        // Function to fade out an element
        function fadeOutElement(element, delay) {
            setTimeout(() => {
                element.classList.add('fade-out'); // Add the fade-out class after delay
            }, delay);
        }

        // Fade out the title first
        fadeOutElement(title, 2000); // Fade out the title after 2 seconds

        // Fade out the instructions after the title has faded out
        fadeOutElement(instructions, 4000); // Fade out the instructions after an additional 2 seconds
    });

    // Start animating all particles
    animate();
})();
