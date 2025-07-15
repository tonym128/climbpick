document.addEventListener('DOMContentLoaded', () => {
    const climbsList = document.getElementById('climbs-list');
    const exportButton = document.getElementById('export-data');
    const importInput = document.getElementById('import-data');

    function renderClimbs() {
        console.log('Rendering climbs');
        climbsList.innerHTML = '';
        const climbs = ClimbStore.getClimbs();
        console.log('Climbs to render:', climbs);
        const climbsByLocation = climbs.reduce((acc, climb) => {
            if (!acc[climb.location]) {
                acc[climb.location] = [];
            }
            acc[climb.location].push(climb);
            return acc;
        }, {});
        console.log('Climbs grouped by location:', climbsByLocation);

        for (const location in climbsByLocation) {
            const group = document.createElement('div');
            group.className = 'climb-group';
            group.innerHTML = `<h3>${location}</h3>`;

            const climbItemsContainer = document.createElement('div');
            climbItemsContainer.className = 'climb-items-container';

            climbsByLocation[location].forEach(climb => {
                const item = document.createElement('div');
                item.className = 'climb-item';
                item.innerHTML = `
                    <a href="climb.html?id=${climb.id}">
                        <img src="${climb.imageData}" alt="${climb.description}" style="width: ${climb.canvasWidth}px; height: ${climb.canvasHeight}px; max-width: 100%; height: auto;">
                    </a>
                    <div>
                        <h4>${climb.description}</h4>
                        <p>Difficulty: ${climb.difficulty}</p>
                    </div>
                `;
                climbItemsContainer.appendChild(item);
            });
            group.appendChild(climbItemsContainer);
            climbsList.appendChild(group);
        }
    }

    exportButton.addEventListener('click', () => {
        const climbs = ClimbStore.getClimbs();
        const dataStr = JSON.stringify(climbs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'climbpicks_data.json';
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedClimbs = JSON.parse(event.target.result);
                    const existingClimbs = ClimbStore.getClimbs();
                    const existingClimbIds = new Set(existingClimbs.map(c => c.id));

                    const newClimbs = importedClimbs.filter(climb => !existingClimbIds.has(climb.id));

                    if (newClimbs.length > 0) {
                        const mergedClimbs = existingClimbs.concat(newClimbs);
                        ClimbStore.saveClimbs(mergedClimbs);
                        renderClimbs();
                        showStatusMessage(`Successfully imported ${newClimbs.length} new climbs!`, 'success');
                    } else {
                        showStatusMessage('No new climbs to import.', 'info');
                    }

                } catch (error) {
                    showStatusMessage('Invalid JSON file.', 'error');
                }
            };
            reader.readAsText(file);
        }
    });

    renderClimbs();
});
