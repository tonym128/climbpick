document.addEventListener('DOMContentLoaded', () => {
    const climbDetailsContainer = document.getElementById('climb-details');
    const editControls = document.getElementById('edit-controls');
    const editClimbButton = document.getElementById('edit-climb');
    const saveClimbButton = document.getElementById('save-climb');
    const cancelEditButton = document.getElementById('cancel-edit');
    const holdsToolbarEdit = document.getElementById('holds-toolbar-edit');

    const urlParams = new URLSearchParams(window.location.search);
    const climbId = urlParams.get('id');

    let currentClimb = null;
    let isEditing = false;
    let editedHolds = [];
    let currentHoldType = 'hand';
    let selectedHoldIndex = -1;
    let isDragging = false;

    const holdColors = {
        hand: 'blue',
        foot: 'yellow',
        start: 'green',
        end: 'red'
    };

    if (climbId) {
        currentClimb = ClimbStore.getClimb(climbId);
        if (currentClimb) {
            editedHolds = JSON.parse(JSON.stringify(currentClimb.holds));
            renderClimbDetails(currentClimb);
            editControls.style.display = 'block';
        } else {
            climbDetailsContainer.innerHTML = '<p>Climb not found.</p>';
        }
    } else {
        climbDetailsContainer.innerHTML = '<p>No climb specified.</p>';
    }

    function renderClimbDetails(climb) {
        if (isEditing) {
            renderEditView(climb);
        } else {
            renderViewMode(climb);
        }
    }

    function renderViewMode(climb) {
        climbDetailsContainer.innerHTML = `
            <h2>${climb.description}</h2>
            <p><strong>Location:</strong> ${climb.location}</p>
            <p><strong>Difficulty:</strong> ${climb.difficulty}</p>
            <p><strong>Date Added:</strong> ${climb.dateAdded}</p>
            <div id="climb-image-container" style="position: relative;">
                <img id="climb-main-image" src="${climb.imageData}" alt="${climb.description}" style="width: 100%; height: auto;">
            </div>
            <div id="attempts-ascends">
                <p>Attempts: <span id="attempts-count">${climb.attempts}</span> <button id="add-attempt">+</button> <button id="remove-attempt">-</button></p>
                <p>Ascends: <span id="ascends-count">${climb.ascends}</span> <button id="add-ascend">+</button> <button id="remove-ascend">-</button></p>
            </div>
        `;

        const holdsOverlay = document.getElementById('climb-image-container');
        const climbImage = document.getElementById('climb-main-image');

        climbImage.onload = () => {
            const imageWidth = climbImage.offsetWidth;
            const imageHeight = climbImage.offsetHeight;

            climb.holds.forEach(hold => {
                const holdElement = document.createElement('div');
                holdElement.style.position = 'absolute';
                holdElement.style.left = `${(hold.x / climb.canvasWidth) * imageWidth}px`;
                holdElement.style.top = `${(hold.y / climb.canvasHeight) * imageHeight}px`;
                holdElement.style.width = '20px';
                holdElement.style.height = '20px';
                holdElement.style.backgroundColor = holdColors[hold.type];
                holdElement.style.borderRadius = '50%';
                holdElement.style.transform = 'translate(-50%, -50%)';
                holdsOverlay.appendChild(holdElement);
            });
        };

        attachAttemptAscendListeners(climb);
    }

    function renderEditView(climb) {
        climbDetailsContainer.innerHTML = `
            <input type="text" id="edit-description" value="${climb.description}">
            <input type="text" id="edit-location" value="${climb.location}">
            <input type="text" id="edit-difficulty" value="${climb.difficulty}">
            <p><strong>Date Added:</strong> ${climb.dateAdded}</p>
            <div id="climb-image-container-edit" style="position: relative; width: ${climb.canvasWidth}px; height: ${climb.canvasHeight}px; margin: auto;">
                 <canvas id="edit-canvas"></canvas>
            </div>
             <div id="attempts-ascends" style="display:none;"></div>
        `;

        const canvas = document.getElementById('edit-canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
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
            document.getElementById('climb-image-container-edit').style.width = `${newWidth}px`;
            document.getElementById('climb-image-container-edit').style.height = `${newHeight}px`;
            drawEditCanvas(ctx, image);
        };
        image.src = climb.imageData;

        attachCanvasEventListeners(canvas, ctx, image);
    }

    function drawEditCanvas(ctx, image) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);
        drawHoldsOnCanvas(ctx, editedHolds);
    }

    function drawHoldsOnCanvas(ctx, holds) {
        holds.forEach((hold, index) => {
            ctx.beginPath();
            ctx.arc(hold.x, hold.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = holdColors[hold.type];
            ctx.fill();
            if (index === selectedHoldIndex) {
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.closePath();
        });
    }

    editClimbButton.addEventListener('click', () => {
        isEditing = true;
        editClimbButton.style.display = 'none';
        saveClimbButton.style.display = 'inline-block';
        cancelEditButton.style.display = 'inline-block';
        holdsToolbarEdit.style.display = 'block';
        renderClimbDetails(currentClimb);
    });

    cancelEditButton.addEventListener('click', () => {
        isEditing = false;
        editedHolds = JSON.parse(JSON.stringify(currentClimb.holds));
        editClimbButton.style.display = 'inline-block';
        saveClimbButton.style.display = 'none';
        cancelEditButton.style.display = 'none';
        holdsToolbarEdit.style.display = 'none';
        renderClimbDetails(currentClimb);
    });

    saveClimbButton.addEventListener('click', () => {
        const newDescription = document.getElementById('edit-description').value;
        const newLocation = document.getElementById('edit-location').value;
        const newDifficulty = document.getElementById('edit-difficulty').value;

        if (!newDescription || !newLocation || !newDifficulty) {
            showStatusMessage('All fields must be filled out.', 'error');
            return;
        }

        currentClimb.description = newDescription;
        currentClimb.location = newLocation;
        currentClimb.difficulty = newDifficulty;
        currentClimb.holds = editedHolds;

        // Update canvas dimensions to reflect the actual rendered size
        const canvas = document.getElementById('edit-canvas');
        currentClimb.canvasWidth = canvas.width;
        currentClimb.canvasHeight = canvas.height;

        if (ClimbStore.updateClimb(currentClimb)) {
            isEditing = false;
            editClimbButton.style.display = 'inline-block';
            saveClimbButton.style.display = 'none';
            cancelEditButton.style.display = 'none';
            holdsToolbarEdit.style.display = 'none';
            renderClimbDetails(currentClimb);
            showStatusMessage('Climb updated successfully!', 'success');
        } else {
            showStatusMessage('Failed to update climb.', 'error');
        }
    });

    holdsToolbarEdit.addEventListener('click', (e) => {
        if (e.target.dataset.holdType) {
            currentHoldType = e.target.dataset.holdType;
            selectedHoldIndex = -1;
        }
        if (e.target.id === 'delete-hold' && selectedHoldIndex !== -1) {
            editedHolds.splice(selectedHoldIndex, 1);
            selectedHoldIndex = -1;
            const canvas = document.getElementById('edit-canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = currentClimb.imageData;
            image.onload = () => drawEditCanvas(ctx, image);
        }
        if (e.target.id === 'undo-hold-edit') {
            editedHolds.pop();
            const canvas = document.getElementById('edit-canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = currentClimb.imageData;
            image.onload = () => drawEditCanvas(ctx, image);
        }
    });

    function attachCanvasEventListeners(canvas, ctx, image) {
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const clickedHoldIndex = editedHolds.findIndex(hold => {
                const dx = hold.x - x;
                const dy = hold.y - y;
                return Math.sqrt(dx * dx + dy * dy) < 10;
            });

            if (clickedHoldIndex !== -1) {
                selectedHoldIndex = clickedHoldIndex;
                isDragging = true;
            } else {
                selectedHoldIndex = -1;
                isDragging = false;
                editedHolds.push({ x, y, type: currentHoldType });
            }
            drawEditCanvas(ctx, image);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && selectedHoldIndex !== -1) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                editedHolds[selectedHoldIndex].x = x;
                editedHolds[selectedHoldIndex].y = y;
                drawEditCanvas(ctx, image);
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    }

    function attachAttemptAscendListeners(climb) {
        const attemptsCount = document.getElementById('attempts-count');
        const ascendsCount = document.getElementById('ascends-count');

        document.getElementById('add-attempt').addEventListener('click', () => {
            climb.attempts++;
            if (ClimbStore.updateClimb(climb)) {
                attemptsCount.textContent = climb.attempts;
            } else {
                climb.attempts--;
                showStatusMessage('Failed to update climb. The browser storage might be full.', 'error');
            }
        });

        document.getElementById('remove-attempt').addEventListener('click', () => {
            if (climb.attempts > 0) {
                climb.attempts--;
                if (ClimbStore.updateClimb(climb)) {
                    attemptsCount.textContent = climb.attempts;
                } else {
                    climb.attempts++;
                    showStatusMessage('Failed to update climb. The browser storage might be full.', 'error');
                }
            }
        });

        document.getElementById('add-ascend').addEventListener('click', () => {
            climb.ascends++;
            if(ClimbStore.updateClimb(climb)) {
                ascendsCount.textContent = climb.ascends;
            } else {
                climb.ascends--;
                showStatusMessage('Failed to update climb. The browser storage might be full.', 'error');
            }
        });

        document.getElementById('remove-ascend').addEventListener('click', () => {
            if (climb.ascends > 0) {
                climb.ascends--;
                if(ClimbStore.updateClimb(climb)) {
                    ascendsCount.textContent = climb.ascends;
                } else {
                    climb.ascends++;
                    showStatusMessage('Failed to update climb. The browser storage might be full.', 'error');
                }
            }
        });
    }
});