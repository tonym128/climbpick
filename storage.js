class ClimbStore {
    static getClimbs() {
        console.log('Getting climbs from localStorage');
        const climbs = localStorage.getItem('climbs');
        const parsedClimbs = climbs ? JSON.parse(climbs) : [];
        console.log('Parsed climbs:', parsedClimbs);
        return parsedClimbs;
    }

    static saveClimbs(climbs) {
        console.log('Saving climbs to localStorage', climbs);
        try {
            localStorage.setItem('climbs', JSON.stringify(climbs));
            console.log('Successfully saved climbs.');
            return true;
        } catch (e) {
            console.error("Error saving to localStorage", e);
            return false;
        }
    }

    static addClimb(climb) {
        console.log('Adding climb:', climb);
        const climbs = ClimbStore.getClimbs();
        climbs.push(climb);
        return ClimbStore.saveClimbs(climbs);
    }

    static getClimb(id) {
        console.log('Getting climb with id:', id);
        const climbs = ClimbStore.getClimbs();
        return climbs.find(climb => climb.id === id);
    }

    static updateClimb(updatedClimb) {
        console.log('Updating climb:', updatedClimb);
        let climbs = ClimbStore.getClimbs();
        climbs = climbs.map(climb => climb.id === updatedClimb.id ? updatedClimb : climb);
        return ClimbStore.saveClimbs(climbs);
    }

    static deleteClimb(id) {
        console.log('Deleting climb with id:', id);
        let climbs = ClimbStore.getClimbs();
        climbs = climbs.filter(climb => climb.id !== id);
        return ClimbStore.saveClimbs(climbs);
    }

    static clearAll() {
        console.log('Clearing all climbs from localStorage');
        try {
            localStorage.removeItem('climbs');
            console.log('Successfully cleared all climbs.');
            return true;
        } catch (e) {
            console.error("Error clearing localStorage", e);
            return false;
        }
    }
}
