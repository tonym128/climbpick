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
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                image = new Image();
                image.onload = () => {
                    const maxWidth = 1024;
                    const aspectRatio = image.width / image.height;
                    let newWidth = image.width;
                    let newHeight = image.height;

                    if (newWidth > maxWidth) {
                        newHeight = maxWidth / aspectRatio;
                        newWidth = maxWidth;
                    }

                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    canvas.style.display = 'block';
                    drawImage();
                };
                image.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
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
            alert('Please fill in all fields and upload an image.');
            return;
        }

        const climb = {
            id: Date.now().toString(),
            description: descriptionInput.value,
            location: locationInput.value,
            difficulty: difficultyInput.value,
            dateAdded: dateAddedInput.value,
            imageData: getResizedImageData(),
            holds: holds,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            attempts: 0,
            ascends: 0
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
    
    function getResizedImageData() {
        const tempCanvas = document.createElement('canvas');
        const maxWidth = 1024;
        const aspectRatio = image.width / image.height;
        const newHeight = maxWidth / aspectRatio;

        tempCanvas.width = maxWidth;
        tempCanvas.height = newHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0, maxWidth, newHeight);
        return tempCanvas.toDataURL('image/jpeg');
    }
});
