
import { useGame } from "@/context/GameContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Home() {
    const { userProgress, loading, resetAllData, curriculum, unlockAllStages } = useGame();
    const [mounted, setMounted] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || loading) {
        return <div className="min-h-[100dvh] flex items-center justify-center bg-blue-50 text-blue-800">読み込み中...</div>;
    }

    // Determine resume target
    const currentStageId = userProgress?.currentStageId;
    const resumeLink = currentStageId ? `/play/${currentStageId}` : "/stages";

    return (
        <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white px-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <h1 className="text-4xl font-black tracking-tight text-blue-600 sm:text-6xl drop-shadow-sm">
                    {curriculum?.title || "CalcStages"}
                </h1>
                <p className="text-lg text-slate-600">
                    スモールステップで計算をマスターしよう！
                </p>

                <div className="space-y-4">
                    <Link
                        to={resumeLink}
                        className="block w-full rounded-2xl bg-orange-500 py-4 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-orange-600 active:scale-95 flex items-center justify-center"
                    >
                        {userProgress?.stageProgressMap[currentStageId || ""]?.cleared ? "つづきから" : "スタート"}
                    </Link>

                    <Link
                        to="/stages"
                        className="block w-full rounded-2xl bg-white py-4 text-xl font-bold text-slate-700 shadow-md ring-1 ring-slate-200 transition-transform hover:bg-slate-50 active:scale-95 flex items-center justify-center"
                    >
                        ステージ一覧
                    </Link>
                </div>

                <div className="pt-8">
                    {!showResetConfirm ? (
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="text-sm text-slate-400 underline hover:text-red-500"
                        >
                            データをリセット
                        </button>
                    ) : (
                        <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                            <p className="mb-3 text-sm text-red-600 font-bold">本当にリセットしますか？</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={resetAllData}
                                    className="rounded bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
                                >
                                    はい
                                </button>
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="rounded bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 border"
                                >
                                    いいえ
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <button
                            onClick={unlockAllStages}
                            className="text-xs text-slate-300 hover:text-blue-400"
                        >
                            先生モード（全解放）
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
