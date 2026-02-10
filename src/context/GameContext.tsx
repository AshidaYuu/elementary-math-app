
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Curriculum, UserProgress, WeakQuestion } from "@/types/curriculum";
import { loadCurriculum } from "@/lib/curriculum/loader";
import { loadProgress, saveProgress, updateStageProgress, updateWeakSet } from "@/lib/gamestate/persistence";

interface GameContextType {
    curriculum: Curriculum | null;
    userProgress: UserProgress | null;
    loading: boolean;
    unlockStage: (stageId: string) => void;
    recordStageResult: (stageId: string, passed: boolean, timeUsed: number, mistakes: WeakQuestion[]) => void;
    resetAllData: () => void;
    unlockAllStages: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        async function init() {
            try {
                const [addCur, subCur, mulCur, writtenAddCur] = await Promise.all([
                    loadCurriculum("ES_G1_ADD"),
                    loadCurriculum("ES_G1_SUB"),
                    loadCurriculum("ES_G2_MUL"),
                    loadCurriculum("ES_G2_ADD_WRITTEN")
                ]);

                // Merge curricula: combine stages from all
                const mergedCurriculum: Curriculum = {
                    ...addCur,
                    stageGraph: {
                        ...addCur.stageGraph,
                        stages: [
                            ...addCur.stageGraph.stages,
                            ...subCur.stageGraph.stages,
                            ...mulCur.stageGraph.stages,
                            ...writtenAddCur.stageGraph.stages
                        ]
                    }
                };

                const prog = loadProgress();

                // Ensure start stages of all curricula are unlocked
                const startStages = [
                    addCur.stageGraph.startStageId,
                    subCur.stageGraph.startStageId,
                    mulCur.stageGraph.startStageId,
                    writtenAddCur.stageGraph.startStageId
                ];
                startStages.forEach(startId => {
                    if (startId && !prog.stageProgressMap[startId]) {
                        prog.stageProgressMap[startId] = {
                            stageId: startId,
                            consecutivePasses: 0,
                            unlocked: true,
                            cleared: false
                        };
                    }
                });
                saveProgress(prog);

                setCurriculum(mergedCurriculum);
                setUserProgress(prog);
            } catch (error) {
                console.error("Failed to load curricula:", error);
            }
            setLoading(false);
        }
        init();
    }, []);

    const unlockStage = (stageId: string) => {
        if (!userProgress) return;
        const map = { ...userProgress.stageProgressMap };
        if (!map[stageId]) {
            map[stageId] = { stageId, consecutivePasses: 0, unlocked: true, cleared: false };
        } else {
            map[stageId].unlocked = true;
        }
        const newProg = { ...userProgress, stageProgressMap: map };
        setUserProgress(newProg);
        saveProgress(newProg);
    };

    const unlockAllStages = () => {
        if (!userProgress || !curriculum) return;
        const map = { ...userProgress.stageProgressMap };
        curriculum.stageGraph.stages.forEach(stage => {
            if (!map[stage.id]) {
                map[stage.id] = { stageId: stage.id, consecutivePasses: 0, unlocked: true, cleared: false };
            } else {
                map[stage.id].unlocked = true;
            }
        });
        const newProg = { ...userProgress, stageProgressMap: map };
        setUserProgress(newProg);
        saveProgress(newProg);
        alert("全てのステージを解放しました（先生モード）");
    };

    const recordStageResult = (stageId: string, passed: boolean, timeUsed: number, mistakes: WeakQuestion[]) => {
        if (!userProgress || !curriculum) return;

        // Update Progress
        // Find next stage logic
        const currentStage = curriculum.stageGraph.stages.find(s => s.id === stageId);
        const nextStageId = currentStage?.nextStageId;

        // Check if we met the consecutive pass requirement to unlock next
        // Current logic: updateStageProgress increments pass.
        // We need to check if *after* update, we unlock.

        // For now, simplified: If passed and consecutive limit met (default 2), unlock next.

        let newProg = updateStageProgress(userProgress, stageId, { passed, time: timeUsed, nextStageId });

        // Check concurrency
        const rule = curriculum.globalRules.pass.consecutivePassesRequired || 2;
        const stageP = newProg.stageProgressMap[stageId];
        if (passed && stageP.consecutivePasses >= rule && nextStageId) {
            // Explicitly unlock next
            const nextP = newProg.stageProgressMap[nextStageId] || { stageId: nextStageId, consecutivePasses: 0, unlocked: false, cleared: false };
            newProg.stageProgressMap[nextStageId] = { ...nextP, unlocked: true };
        }

        // Update WeakSet - 一時的に無効化
        // if (mistakes.length > 0) {
        //     newProg.weakSet = updateWeakSet(newProg.weakSet, mistakes);
        // }
        // If passed, maybe remove solved weak questions?
        // Advanced: If we answered a weak question correctly, decrement its mistake count or remove?
        // For now, just accumulation is safe.

        setUserProgress(newProg);
        saveProgress(newProg);
    };

    const resetAllData = () => {
        // Clear LocalStorage
        if (typeof window !== "undefined") {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <GameContext.Provider value={{ curriculum, userProgress, loading, unlockStage, recordStageResult, resetAllData, unlockAllStages }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within GameProvider");
    return context;
}
