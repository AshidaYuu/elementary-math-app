
import { useGame } from "@/context/GameContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Stages() {
    const { curriculum, userProgress, loading } = useGame();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || loading || !curriculum || !userProgress) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const { stages } = curriculum.stageGraph;

    // Find the index of the first unlocked but not cleared stage (aka "Next Up")
    const nextStageIndex = stages.findIndex(s => {
        const p = userProgress.stageProgressMap[s.id];
        return p?.unlocked && !p?.cleared;
    });
    // If all unlocked are cleared, maybe none? Or check if last one is unlocked?
    // If none found (maybe all cleared, or none unlocked?), fallback.
    // Actually, if all cleared, nextStageIndex = -1.

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 px-4 py-4 backdrop-blur-md shadow-sm">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <Link to="/" className="text-sm font-bold text-blue-500 hover:underline">
                        ← もどる
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800">ステージ一覧</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
                {stages.map((stage, index) => {
                    const progress = userProgress.stageProgressMap[stage.id];
                    const isUnlocked = progress?.unlocked;
                    const isCleared = progress?.cleared;
                    const passCount = progress?.consecutivePasses || 0;
                    const required = curriculum.globalRules.pass.consecutivePassesRequired;

                    const isNext = index === nextStageIndex;

                    return (
                        <div
                            key={stage.id}
                            className={`relative overflow-hidden rounded-xl border-2 transition-all
                                ${isNext
                                    ? "border-orange-500 bg-orange-50/50 shadow-md transform scale-[1.02] ring-4 ring-orange-200 ring-offset-2 z-10"
                                    : isUnlocked
                                        ? "border-blue-100 bg-white shadow-sm hover:border-blue-300"
                                        : "border-slate-100 bg-slate-100 opacity-70"
                                }`}
                        >
                            {isNext && (
                                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg animate-pulse">
                                    今日やる！
                                </div>
                            )}

                            <div className="p-4 flex items-center gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black text-xl
                    ${isNext || isUnlocked ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"}`}>
                                    {index + 1}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className={`font-bold ${isUnlocked ? "text-slate-800" : "text-slate-400"}`}>
                                            {stage.title}
                                        </h2>
                                        {isCleared && (
                                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                                                CLEAR
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-4 text-xs font-medium text-slate-500">
                                        <span>{stage.mode}</span>
                                        <span>全{stage.round.questions}問</span>
                                        {isUnlocked && (
                                            <span className={passCount >= required ? "text-green-600" : "text-slate-400"}>
                                                合格: {passCount} / {required}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {isUnlocked ? (
                                        <Link
                                            to={`/play/${stage.id}`}
                                            className={`flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-white transition-colors active:translate-y-0.5
                                            ${isNext ? "bg-orange-500 hover:bg-orange-600 shadow-lg" : "bg-blue-500 hover:bg-blue-600"}`}
                                        >
                                            {isNext ? "スタート" : "挑戦"}
                                        </Link>
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center text-slate-400">
                                            🔒
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
}
