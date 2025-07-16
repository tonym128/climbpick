document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const holdsToolbar = document.getElementById('holds-toolbar');
    const undoHoldButton = document.getElementById('undo-hold');
    const descriptionInput = document.getElementById('description');
    const locationInput = document.getElementById('location');
    const difficultyInput = document.getElementById('difficulty');
    const dateAddedInput = document.getElementById('date-added');
    const saveClimbButton = document.getElementById('save-climb');

    let image = null;
    let imageData = null;
    let holds = [];
    let currentHoldType = 'hand';
    const holdColors = {
        hand: 'blue',
        foot: 'yellow',
        start: 'green',
        end: 'red'
    };

    dateAddedInput.valueAsDate = new Date();

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }
        holds = [];

        const compressorOptions = {
            quality: 0.6,
            retainExif: false,
            width: 1024,
            height: 768,
            mimeType: "image/jpeg",
            resize: 'contain',
            convertSize: 1,
            convertTypes: ['image/png', 'image/webp'],
            success(result) {
                const imageURL = URL.createObjectURL(result);
                image = new Image();
                image.onload = () => {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    canvas.style.display = 'block';
                    drawImage();
                    imageData = canvas.toDataURL('image/jpeg');
                };
                image.src = imageURL;
            },
            error(err) {
                console.log(err.message);
            },
        };

        new Compressor(file, compressorOptions);
    });

    holdsToolbar.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.holdType) {
            currentHoldType = e.target.dataset.holdType;
        }
    });

    canvas.addEventListener('click', (e) => {
        if (!image) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        holds.push({ x, y, type: currentHoldType });
        draw();
    });

    undoHoldButton.addEventListener('click', () => {
        holds.pop();
        draw();
    });

    saveClimbButton.addEventListener('click', () => {
        console.log('Save button clicked');
        if (!image || !descriptionInput.value || !locationInput.value || !difficultyInput.value) {
            showStatusMessage('Please fill in all fields and upload an image.', 'error');
            return;
        }

        const currentUser = ClimbStore.getCurrentUser();
        const climb = {
            id: Date.now().toString(),
            description: descriptionInput.value,
            location: locationInput.value,
            difficulty: difficultyInput.value,
            dateAdded: dateAddedInput.value,
            imageData: imageData,
            holds: holds,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            logbook: {
                [currentUser]: {
                    attempts: 0,
                    ascends: 0
                }
            }
        };
        console.log('Creating climb object:', climb);

        const success = ClimbStore.addClimb(climb);
        console.log('Save success:', success);
        if (success) {
            showStatusMessage('Climb saved!', 'success');
            setTimeout(() => window.location.href = 'view.html', 1000);
        } else {
            showStatusMessage('Failed to save climb. The browser storage might be full.', 'error');
        }
    });

    function drawImage() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (image) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
    }

    function drawHolds() {
        holds.forEach(hold => {
            ctx.beginPath();
            ctx.arc(hold.x, hold.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = holdColors[hold.type];
            ctx.fill();
            ctx.closePath();
        });
    }

    function draw() {
        drawImage();
        drawHolds();
    }
});
