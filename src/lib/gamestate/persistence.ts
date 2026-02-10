
import { UserProgress, WeakQuestion } from "@/types/curriculum";

const STORAGE_KEY = "calcstages_progress_v2";

const DEFAULT_PROGRESS: UserProgress = {
    currentTrackId: "ES_G1_ADD",
    currentStageId: "G1A_NUM10_MAKE_SEQ_1_5",
    stageProgressMap: {},
    weakSet: [],
    lastPlayedAt: Date.now(),
};

export function loadProgress(): UserProgress {
    if (typeof window === "undefined") return DEFAULT_PROGRESS;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_PROGRESS;
        return JSON.parse(raw);
    } catch (e) {
        console.error("Failed to load progress", e);
        return DEFAULT_PROGRESS;
    }
}

export function saveProgress(progress: UserProgress): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save progress", e);
    }
}

export function updateStageProgress(
    current: UserProgress,
    stageId: string,
    result: { passed: boolean; time?: number; nextStageId?: string | null }
): UserProgress {
    const map = { ...current.stageProgressMap };
    const prev = map[stageId] || { stageId, consecutivePasses: 0, unlocked: true, cleared: false };

    let newConsecutive = prev.consecutivePasses;
    let newCleared = prev.cleared;

    if (result.passed) {
        newConsecutive += 1;
        // Check clear condition (e.g. 2 passes) - logic should be outside or passed in
        // Assume context handles "isCleared" check based on Curriculum rules, 
        // but here we just update stats.
        newCleared = true; // Mark cleared if passed once? Or strictly after N?
        // Let's assume passed = passed the criteria (time, accuracy) for one round.
    } else {
        newConsecutive = 0;
    }

    map[stageId] = {
        ...prev,
        consecutivePasses: newConsecutive,
        cleared: newCleared || prev.cleared, // Once cleared, always cleared? Or can regress?
        bestTimeSec: result.time && (!prev.bestTimeSec || result.time < prev.bestTimeSec) ? result.time : prev.bestTimeSec
    };

    // Unlock next if passed (logic might vary, but simple chain for now)
    if (result.passed && result.nextStageId) {
        const next = map[result.nextStageId] || { stageId: result.nextStageId, consecutivePasses: 0, unlocked: false, cleared: false };
        map[result.nextStageId] = { ...next, unlocked: true };
    }

    return {
        ...current,
        stageProgressMap: map,
        lastPlayedAt: Date.now()
    };
}

export function updateWeakSet(current: WeakQuestion[], newMistakes: WeakQuestion[]): WeakQuestion[] {
    // Merge logic
    // If exists, update count. If not, add.
    // Limit size to 50?
    const map = new Map<string, WeakQuestion>();
    current.forEach(w => map.set(w.questionId, w));

    newMistakes.forEach(m => {
        const existing = map.get(m.questionId);
        if (existing) {
            map.set(m.questionId, {
                ...existing,
                mistakeCount: existing.mistakeCount + 1,
                lastMistakeAt: Date.now(),
                data: m.data // Update data just in case
            });
        } else {
            map.set(m.questionId, m);
        }
    });

    // Convert back and sort by recency/count
    const result = Array.from(map.values()).sort((a, b) => b.lastMistakeAt - a.lastMistakeAt);
    return result.slice(0, 50);
}
