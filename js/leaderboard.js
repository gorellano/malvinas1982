/**
 * 1982: Héroes de Malvinas - Leaderboard Manager
 * Manages local high scores using localStorage.
 * Pre-seeds the system with legendary historical pilots.
 */

class LeaderboardManager {
    constructor() {
        this.storageKey = '1982_malvinas_highscores';
        this.maxEntries = 10;
        this.defaultScores = [
            { name: 'C. CARBALLO', score: 95000, plane: 'A-4B SKYHAWK', difficulty: 'DIFÍCIL', date: '1982-05-01' },
            { name: 'T. VOLPONI', score: 82000, plane: 'MIRAGE 5', difficulty: 'DIFÍCIL', date: '1982-05-21' },
            { name: 'H. SANCHEZ', score: 78000, plane: 'A-4B SKYHAWK', difficulty: 'DIFÍCIL', date: '1982-06-08' },
            { name: 'O. CASTILLO', score: 65000, plane: 'A-4B SKYHAWK', difficulty: 'NORMAL', date: '1982-05-24' },
            { name: 'R. BEDACARRATZ', score: 62000, plane: 'SUPER ÉTENDARD', difficulty: 'DIFÍCIL', date: '1982-05-04' },
            { name: 'A. PRONOBIS', score: 55000, plane: 'IA-58 PUCARÁ', difficulty: 'NORMAL', date: '1982-05-28' },
            { name: 'A. FRISCH', score: 48000, plane: 'IA-58 PUCARÁ', difficulty: 'NORMAL', date: '1982-05-15' },
            { name: 'M. MAYORA', score: 45000, plane: 'SUPER ÉTENDARD', difficulty: 'FÁCIL', date: '1982-05-04' },
            { name: 'G. ISAAC', score: 38000, plane: 'A-4C SKYHAWK', difficulty: 'DIFÍCIL', date: '1982-05-30' },
            { name: 'U. URETA', score: 35000, plane: 'A-4C SKYHAWK', difficulty: 'DIFÍCIL', date: '1982-05-30' }
        ];
    }

    /**
     * Retrieves high scores from storage or seeds the default scores if none exist.
     * @returns {Array} List of high score objects.
     */
    getScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.sort((a, b) => b.score - a.score);
                }
            }
        } catch (e) {
            console.error("Could not parse high scores from localStorage:", e);
        }
        
        // Seed default scores
        this.saveScores(this.defaultScores);
        return this.defaultScores;
    }

    /**
     * Checks if a score qualifies for the Top 10 leaderboard.
     * @param {number} score - The score to check.
     * @returns {boolean} True if the score qualifies.
     */
    qualifies(score) {
        if (score <= 0) return false;
        const scores = this.getScores();
        if (scores.length < this.maxEntries) return true;
        return score > scores[scores.length - 1].score;
    }

    /**
     * Adds a new pilot score entry to the leaderboard and persists it.
     * @param {string} rawName - Name of the pilot.
     * @param {number} score - Achieved score.
     * @param {string} plane - Aircraft used.
     * @param {string} difficulty - Selected game difficulty level.
     * @returns {Array} The updated list of high scores.
     */
    addScore(rawName, score, plane, difficulty) {
        const scores = this.getScores();
        const cleanName = (rawName || 'PILOTO ANONIMO').trim().toUpperCase().substring(0, 15);
        const newEntry = {
            name: cleanName,
            score: Math.max(0, score),
            plane: plane ? plane.toUpperCase() : 'DESCONOCIDO',
            difficulty: difficulty ? difficulty.toUpperCase() : 'NORMAL',
            date: new Date().toISOString().split('T')[0]
        };

        scores.push(newEntry);
        // Sort descending and keep the top 10
        const sortedScores = scores.sort((a, b) => b.score - a.score).slice(0, this.maxEntries);
        
        // Wipe local storage first to force update and avoid stale cache
        localStorage.removeItem(this.storageKey);
        this.saveScores(sortedScores);
        return sortedScores;
    }

    /**
     * Persists high scores to localStorage.
     * @param {Array} scores - The score list to save.
     */
    saveScores(scores) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
        } catch (e) {
            console.error("Failed to save high scores to localStorage:", e);
        }
    }

    /**
     * Resets the leaderboard to default historical scores.
     */
    reset() {
        this.saveScores(this.defaultScores);
        return this.defaultScores;
    }
}

// Export global leaderboard instance
window.leaderboardManager = new LeaderboardManager();
