import { useGame } from "@/context/GameContext";
import { generateQuestionsForStage } from "@/lib/generator";
import { Question, WeakQuestion } from "@/types/curriculum";
import { useParams, useNavigate, Link } from "react-router-dom";
import WrittenCalcInput, { WrittenCalcInputRef } from '@/components/game/WrittenCalcInput';
import { useEffect, useRef, useState, useCallback } from "react";
import { NumberPad } from "@/components/game/NumberPad";
import { TenBlockVisual } from "@/components/game/TenBlockVisual";
import { SakuranboVisual } from "@/components/game/SakuranboVisual";
import { SakuranboSubVisual } from "@/components/game/SakuranboSubVisual";
import { StandardInputPrompt } from "@/components/game/StandardInputPrompt";
import SkipCountBoxes, { SkipCountBoxesRef } from "@/components/game/SkipCountBoxes";
import SkipTapGame from "@/components/game/SkipTapGame";
import PlaceValueInput, { PlaceValueInputRef } from "@/components/game/PlaceValueInput";
import WrittenFormFill, { WrittenFormFillRef } from "../components/game/WrittenFormFill";
import WrittenFormChoice from "@/components/game/WrittenFormChoice";
import CarryMarkTap from "@/components/game/CarryMarkTap";

export default function PlayPage() {
    const { stageId } = useParams();
    const navigate = useNavigate();
    const { curriculum, userProgress, loading, recordStageResult } = useGame();

    // Game State
    const [phase, setPhase] = useState<'review' | 'new' | 'finished'>('new');
    const [reviewQList, setReviewQList] = useState<Question[]>([]);
    const [newQList, setNewQList] = useState<Question[]>([]);
    const [showPhaseTransition, setShowPhaseTransition] = useState(false);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const [status, setStatus] = useState<'optimizing' | 'ready' | 'playing' | 'feedback' | 'finished'>('optimizing');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [results, setResults] = useState<{ q: Question, correct: boolean, time: number }[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [mistakes, setMistakes] = useState<WeakQuestion[]>([]);
    const [inputReady, setInputReady] = useState(false);

    // Sakuranbo State
    const [sakuranboSteps, setSakuranboSteps] = useState<string[]>(["", "", ""]);
    const [sakuranboStepIndex, setSakuranboStepIndex] = useState(0);
    const [shake, setShake] = useState(false);

    // Refs for synchronous reads (prevent stale closures)
    const sakuranboStepsRef = useRef<string[]>(["", "", ""]);
    const sakuranboStepIndexRef = useRef(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const qTimeRef = useRef<number>(0);

    // Ref for SkipCountBoxes
    const skipCountBoxesRef = useRef<SkipCountBoxesRef>(null);
    // Ref for PlaceValueInput
    const placeValueRef = useRef<PlaceValueInputRef>(null);
    // Ref for WrittenFormFill
    const writtenFormFillRef = useRef<WrittenFormFillRef>(null);
    // Ref for WrittenCalcInput
    const writtenCalcInputRef = useRef<WrittenCalcInputRef>(null);

    const initRef = useRef<string | null>(null);

    useEffect(() => {
        if (loading || !curriculum || !stageId) return;

        // Skip if already initialized for this stageId
        if (initRef.current === stageId) return;

        const stage = curriculum.stageGraph.stages.find(s => s.id === stageId);
        if (!stage) {
            alert("ステージが見つかりません");
            navigate("/");
            return;
        }

        // Check for Teacher Mode
        const searchParams = new URLSearchParams(window.location.search);
        const isTeacherMode = searchParams.get('mode') === 'teacher';

        // Reset all state explicitly
        initRef.current = stageId;

        // 復習ロジックを一時的に無効化 - 常に空のweakSetを渡す
        const { reviewQuestions, newQuestions } = generateQuestionsForStage(stage, []);

        setReviewQList([]);  // 復習なし
        setNewQList(newQuestions);

        // 常に新規問題からスタート
        setPhase('new');
        setQuestions(newQuestions);

        setResults([]);
        setMistakes([]);
        setCurrentIndex(0);
        setCurrentInput("");
        setFeedback(null);
        setInputReady(false);
        setSakuranboSteps(["", "", ""]);
        setSakuranboStepIndex(0);

        // const totalTime = generated.length * stage.round.secPerQuestion; 
        // setTimeLeft(totalTime); // No longer needed, set per question
        setTimeLeft(stage.round.secPerQuestion); // Display first Q limit

        setStatus('ready');

        // Force cleanup of timers
        if (timerRef.current) clearInterval(timerRef.current);

    }, [loading, curriculum, stageId, navigate]);

    // Sync currentInput to Ref for Timer access
    const currentInputRef = useRef("");
    useEffect(() => {
        currentInputRef.current = currentInput;
    }, [currentInput]);

    useEffect(() => {
        if (status === 'playing') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 0) {
                        // Time over -> Check validation with current input
                        checkAnswer(undefined, true);
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, currentIndex]); // depend on currentIndex to reset properly if needed

    const startGame = () => {
        setStartTime(Date.now());
        startQuestionTimer();
        // Debounce input
        setTimeout(() => setInputReady(true), 500);
    };

    const startQuestionTimer = () => {
        if (!curriculum || !stageId) return;
        const stage = curriculum.stageGraph.stages.find(s => s.id === stageId);
        if (stage) {
            setTimeLeft(stage.round.secPerQuestion);
        }
        setStatus('playing');
        qTimeRef.current = Date.now();
    };

    const isAdvancing = useRef(false);

    // Reset all sakuranbo state when question changes
    useEffect(() => {
        const initialSteps = ["", "", ""];
        setSakuranboSteps(initialSteps);
        setSakuranboStepIndex(0);
        // Also update refs synchronously
        sakuranboStepsRef.current = initialSteps;
        sakuranboStepIndexRef.current = 0;
        isAdvancing.current = false;
    }, [currentIndex]);

    // Reset advancing lock when step changes (allows input on new step)
    useEffect(() => {
        isAdvancing.current = false;
    }, [sakuranboStepIndex]);

    const handleSakuranboInput = (val: string) => {
        // Block input if currently auto-advancing
        if (isAdvancing.current) {
            return;
        }

        const currentQ = questions[currentIndex];
        if (!currentQ.metadata) return;

        const { complement, remainder, step1, step2, minuend } = currentQ.metadata;
        const answer = currentQ.answer;

        // READ FROM REFS (not state) to avoid stale closures
        const stepIndex = sakuranboStepIndexRef.current;
        const steps = sakuranboStepsRef.current;

        // Determine if subtraction (has minuend) or addition (has complement)
        const isSubtraction = !!minuend;

        // For subtraction: Step 0 = step1 (10-subtrahend), Step 1 = step2 (answer)
        // For addition: Step 0 = complement, Step 1 = remainder, Step 2 = answer

        let expected = "";
        if (isSubtraction) {
            if (stepIndex === 0) expected = step1?.toString() || "";
            else if (stepIndex === 1) expected = step2?.toString() || "";
        } else {
            if (stepIndex === 0) expected = complement?.toString() || "";
            else if (stepIndex === 1) expected = remainder?.toString() || "";
            else if (stepIndex === 2) expected = answer.toString();
        }

        const currentStepInput = steps[stepIndex];

        if (val === 'DEL') {
            if (currentStepInput.length > 0) {
                // Delete char from current step
                const nextSteps = [...steps];
                nextSteps[stepIndex] = currentStepInput.slice(0, -1);
                // Update BOTH ref and state
                sakuranboStepsRef.current = nextSteps;
                setSakuranboSteps(nextSteps);
            } else if (stepIndex > 0) {
                // Go back to previous step if current is empty
                const newIndex = stepIndex - 1;
                sakuranboStepIndexRef.current = newIndex;
                setSakuranboStepIndex(newIndex);
            }
            return;
        }

        if (val === 'ENTER') {
            // If current step is empty, ignore ENTER (don't shake)
            if (!currentStepInput) {
                return;
            }

            if (currentStepInput === expected) {
                // Correct!
                const isSplitOnly = currentQ.metadata?.sakuranboMode?.includes('split_only');
                // Subtraction: 2 steps (0, 1), Addition split_only: 2 steps, Addition full: 3 steps
                const isFinalStep = isSubtraction ? stepIndex === 1 : (isSplitOnly ? stepIndex === 1 : stepIndex === 2);

                if (isFinalStep) {
                    // All done - lock input and check answer
                    isAdvancing.current = true;
                    setTimeout(() => checkAnswer(currentStepInput), 200);
                } else {
                    // Next step - update BOTH ref and state (no lock needed)
                    const newIndex = stepIndex + 1;
                    sakuranboStepIndexRef.current = newIndex;
                    setSakuranboStepIndex(newIndex);
                }
            } else {
                // Incorrect step
                setShake(true);
                setTimeout(() => setShake(false), 500);
            }
            return;
        }

        // Add input (limit length)
        if (currentStepInput.length >= 2) return;
        const nextSteps = [...steps];
        nextSteps[stepIndex] = currentStepInput + val;
        // Update BOTH ref and state
        sakuranboStepsRef.current = nextSteps;
        setSakuranboSteps(nextSteps);

        // Auto-advance if match found
        const nextVal = currentStepInput + val;

        if (nextVal === expected) {
            // Correct answer - advance to next step immediately
            const isSplitOnly = currentQ.metadata?.sakuranboMode?.includes('split_only');
            // Subtraction: 2 steps (0, 1), Addition split_only: 2 steps, Addition full: 3 steps
            const isFinalStep = isSubtraction ? stepIndex === 1 : (isSplitOnly ? stepIndex === 1 : stepIndex === 2);

            if (isFinalStep) {
                // All steps done - check answer after a brief visual delay
                isAdvancing.current = true;
                setTimeout(() => checkAnswer(nextVal), 200);
            } else {
                // Move to next step - update BOTH ref and state
                const newIndex = stepIndex + 1;
                sakuranboStepIndexRef.current = newIndex;
                setSakuranboStepIndex(newIndex);
            }
        }
    };

    const handleInput = useCallback((val: string) => {
        // Block input if not playing, not ready, or during feedback animation
        if (status !== 'playing' || !inputReady || feedback) return;

        const currentQ = questions[currentIndex];

        // Route to SkipCountBoxes handler
        if (currentQ?.metadata?.format === 'sequence_boxes') {
            skipCountBoxesRef.current?.handleInput(val);
            return;
        }

        // Route to WrittenFormFill handler
        if (currentQ.metadata?.poolType === 'written_form_fill') {
            writtenFormFillRef.current?.handleInput(val);
            return;
        }

        // Route to PlaceValueInput handler
        if (currentQ.metadata?.poolType === 'place_value_2d' || currentQ.metadata?.poolType === 'place_value_3d') {
            placeValueRef.current?.handleInput(val);
            return;
        }

        // Route to WrittenCalcInput handler
        if (currentQ.metadata?.poolType === 'written_add_2d2d' || currentQ.metadata?.poolType === 'written_verify') {
            writtenCalcInputRef.current?.handleInput(val);
            return;
        }

        // Route to Sakuranbo handler
        if (currentQ.type === 'fill') {
            handleSakuranboInput(val);
            return;
        }

        if (val === 'DEL') {
            setCurrentInput(prev => prev.slice(0, -1));
            return;
        }
        if (val === 'ENTER') {
            checkAnswer();
            return;
        }

        const next = currentInput + val;
        setCurrentInput(next);
    }, [status, inputReady, feedback, questions, currentIndex, currentInput]);

    const checkAnswer = (valOverride?: string, _isTimeout: boolean = false) => {
        // Always use ref to get the latest input value
        let val = valOverride;
        if (val === undefined) {
            val = currentInputRef.current;
        }

        const currentQ = questions[currentIndex];
        let isCorrect = val == currentQ.answer;

        // Special check for split_only mode
        if (currentQ.metadata?.sakuranboMode?.includes('split_only')) {
            isCorrect = val == currentQ.metadata.remainder.toString();
        }

        // Stop timer
        if (timerRef.current) clearInterval(timerRef.current);
        const timeTaken = (Date.now() - qTimeRef.current) / 1000;

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        // Play sound (mock)
        // const audio = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
        // audio.play().catch(() => {});

        setTimeout(() => {
            const newResults = [...results, { q: currentQ, correct: isCorrect, time: timeTaken }];
            setResults(newResults);
            setFeedback(null);

            if (!isCorrect) {
                // Record mistake
                const newMistakes = [...mistakes, {
                    questionId: currentQ.id,
                    mistakeCount: 1,
                    lastMistakeAt: Date.now(),
                    solvedCount: 0,
                    data: currentQ
                }];
                setMistakes(newMistakes);

                // 2問以上間違ったら即不合格
                const mistakeCount = newResults.filter(r => !r.correct).length;
                if (mistakeCount >= 2) {
                    // Fill remaining questions as not attempted and finish
                    const finalResults = [...newResults];
                    finishGame(finalResults);
                    return;
                }
            }

            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setCurrentInput("");
                setSakuranboSteps(["", "", ""]);
                setSakuranboStepIndex(0);
                startQuestionTimer();
            } else {
                // End of current list
                if (phase === 'review' && newQList.length > 0) {
                    // Transition to New Questions
                    setShowPhaseTransition(true);
                    setStatus('ready'); // Pause input

                    // 2 seconds transition
                    setTimeout(() => {
                        setPhase('new');
                        setQuestions(newQList);
                        setCurrentIndex(0);
                        setCurrentInput("");
                        setSakuranboSteps(["", "", ""]);
                        setSakuranboStepIndex(0);
                        setShowPhaseTransition(false);
                        startQuestionTimer();
                    }, 2000);
                } else {
                    // All done
                    finishGame(newResults);
                }
            }
        }, 1000); // Wait for feedback animation
    };

    const finishGame = (finalResults: typeof results) => {
        setStatus('finished');
        if (curriculum && stageId) {
            const stage = curriculum.stageGraph.stages.find(s => s.id === stageId);
            if (stage) {
                const correctCount = finalResults.filter(r => r.correct).length;
                const accuracy = Math.round((correctCount / finalResults.length) * 100) || 0;
                const isPassed = accuracy >= (curriculum.globalRules.pass.accuracy || 0);
                const totalTime = finalResults.reduce((acc, r) => acc + r.time, 0);

                const newMistakesProp: WeakQuestion[] = finalResults
                    .filter(r => !r.correct)
                    .map(r => ({
                        questionId: r.q.id,
                        mistakeCount: 1,
                        lastMistakeAt: Date.now(),
                        solvedCount: 0,
                        data: r.q
                    }));

                recordStageResult(stage.id, isPassed, totalTime, newMistakesProp);
            }
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (status !== 'playing') return;

            const currentQ = questions[currentIndex];

            // For sequence_boxes format, route keyboard input to SkipCountBoxes
            if (currentQ?.metadata?.format === 'sequence_boxes') {
                if (e.key >= '0' && e.key <= '9') {
                    skipCountBoxesRef.current?.handleInput(e.key);
                } else if (e.key === 'Backspace') {
                    skipCountBoxesRef.current?.handleInput('DEL');
                } else if (e.key === 'Enter') {
                    skipCountBoxesRef.current?.handleInput('ENTER');
                }
                return;
            }

            if (e.key >= '0' && e.key <= '9') handleInput(e.key);
            if (e.key === 'Backspace') handleInput('DEL');
            if (e.key === 'Enter') handleInput('ENTER');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [status, handleInput, questions, currentIndex]);

    if (loading || !curriculum) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    if (status === 'finished') {
        // Calc Accuracy
        const correctCount = results.filter(r => r.correct).length;
        const accuracy = Math.round((correctCount / results.length) * 100) || 0;
        // Use global rule for accuracy requirement
        const isPassed = accuracy >= (curriculum.globalRules.pass.accuracy || 0);

        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <h1 className="text-4xl font-black text-slate-800 mb-8">
                    Result: {correctCount} / {results.length}
                </h1>
                <div className="text-6xl font-black mb-12 animate-bounce">
                    {isPassed ? '🎉 CLEAR!' : '💪 Fight!'}
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
                >
                    Back to Actions
                </button>
            </div>
        );
    }

    // Optimizing or Ready
    if (status === 'optimizing' || status === 'ready') {
        const stage = curriculum.stageGraph.stages.find(s => s.id === stageId);
        if (!stage) return <div>Stage not found</div>;

        return (
            <div className="h-screen flex flex-col items-center justify-center bg-blue-500 text-white p-4">
                {status === 'optimizing' ? (
                    <div className="text-2xl font-bold animate-pulse">Preparing...</div>
                ) : (
                    <>
                        <h1 className="text-4xl font-black mb-4 text-center">{stage.title}</h1>
                        <div className="mb-12 text-center">
                            {reviewQList.length > 0 && (
                                <div className="text-xl font-bold bg-white/20 rounded-lg px-4 py-2 mb-2">
                                    🔄 復習: {reviewQList.length}問
                                </div>
                            )}
                            <div className="text-xl font-bold bg-white/20 rounded-lg px-4 py-2">
                                📝 新しい問題: {newQList.length}問
                            </div>
                            <p className="mt-4 text-sm opacity-80">1問 {stage.round.secPerQuestion}秒</p>
                        </div>
                        <button
                            onClick={startGame}
                            className="bg-white text-blue-600 rounded-full px-12 py-6 text-3xl font-bold hover:scale-105 transition-transform shadow-lg active:scale-95"
                        >
                            {reviewQList.length > 0 ? "復習からスタート！" : "スタート！"}
                        </button>
                    </>
                )}
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    // Safety check
    if (!currentQ && !showPhaseTransition) {
        return <div className="p-8 text-center bg-slate-50 h-screen flex items-center justify-center">
            Loading...
        </div>;
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
            {/* Phase Transition Overlay */}
            {showPhaseTransition && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/90 backdrop-blur-sm transition-all duration-300">
                    <div className="text-white text-center animate-bounce">
                        <div className="text-6xl mb-4">✨</div>
                        <h2 className="text-4xl font-black mb-2">Excellent!</h2>
                        <p className="text-2xl font-bold">次は新しい問題だよ！</p>
                    </div>
                </div>
            )}

            {/* Header / Timer */}
            <div className="flex justify-between items-center p-4">
                <button onClick={() => navigate('/')} className="text-slate-400 font-bold w-8">✕</button>

                {/* Phase Badge */}
                <div className="flex flex-col items-center">
                    {phase === 'review' ? (
                        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 mb-1">
                            🔄 復習 {currentIndex + 1}/{reviewQList.length}
                        </div>
                    ) : (
                        <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 mb-1">
                            📝 新しい問題 {currentIndex + 1}/{newQList.length}
                        </div>
                    )}

                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-32 sm:w-48">
                        <div
                            className={`h-full transition-all duration-100 delay-0 ease-linear ${phase === 'review' ? 'bg-orange-400' : 'bg-blue-500'}`}
                            style={{ width: `${(timeLeft / (curriculum?.stageGraph.stages.find(s => s.id === stageId)?.round.secPerQuestion || 10)) * 100}%` }}
                        />
                    </div>
                </div>

                <div className={`font-bold w-12 text-right ${phase === 'review' ? 'text-orange-400' : 'text-blue-500'}`}>
                    {timeLeft.toFixed(1)}s
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-md mx-auto overflow-y-auto min-h-0">

                {/* Modular Question Visual */}
                {(currentQ.metadata?.poolType === 'place_value_2d' || currentQ.metadata?.poolType === 'place_value_3d') ? (
                    /* 位取りトレーニング */
                    /* 位取りトレーニング */
                    <PlaceValueInput
                        ref={placeValueRef}
                        key={`place_value_${currentIndex}`}
                        question={currentQ}
                        onComplete={(isCorrect: boolean) => {
                            // Stop timer
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;

                            setFeedback(isCorrect ? 'correct' : 'incorrect');

                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: isCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);

                                if (!isCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id,
                                        mistakeCount: 1,
                                        lastMistakeAt: Date.now(),
                                        solvedCount: 0,
                                        data: currentQ
                                    }]);

                                    // 2問以上間違ったら即不合格
                                    const mistakeCount = newResults.filter(r => !r.correct).length;
                                    if (mistakeCount >= 2) {
                                        finishGame(newResults);
                                        return;
                                    }
                                }

                                // Check if there are more questions
                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                    startQuestionTimer();
                                } else {
                                    finishGame(newResults);
                                }
                            }, 500);
                        }}
                    />
                ) : (currentQ.metadata?.poolType === 'written_form_fill') ? (
                    /* 筆算フォーム穴埋め */
                    <WrittenFormFill
                        ref={writtenFormFillRef}
                        key={`wf_fill_${currentIndex}`}
                        question={currentQ}
                        onComplete={(isCorrect: boolean) => {
                            // Stop timer
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;

                            setFeedback(isCorrect ? 'correct' : 'incorrect');

                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: isCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);

                                if (!isCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id,
                                        mistakeCount: 1,
                                        lastMistakeAt: Date.now(),
                                        solvedCount: 0,
                                        data: currentQ
                                    }]);

                                    const mistakeCount = newResults.filter(r => !r.correct).length;
                                    if (mistakeCount >= 2) {
                                        finishGame(newResults);
                                        return;
                                    }
                                }

                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                    startQuestionTimer();
                                } else {
                                    finishGame(newResults);
                                }
                            }, 500);
                        }}
                    />
                ) : (currentQ.metadata?.poolType === 'written_form_choice') ? (
                    /* 筆算フォーム選択 */
                    <WrittenFormChoice
                        key={`wf_choice_${currentIndex}`}
                        question={currentQ}
                        onComplete={(isCorrect: boolean) => {
                            // Stop timer
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;

                            setFeedback(isCorrect ? 'correct' : 'incorrect');

                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: isCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);

                                if (!isCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id,
                                        mistakeCount: 1,
                                        lastMistakeAt: Date.now(),
                                        solvedCount: 0,
                                        data: currentQ
                                    }]);

                                    const mistakeCount = newResults.filter(r => !r.correct).length;
                                    if (mistakeCount >= 2) {
                                        finishGame(newResults);
                                        return;
                                    }
                                }

                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                    startQuestionTimer();
                                } else {
                                    finishGame(newResults);
                                }
                            }, 500);
                        }}
                    />
                ) : currentQ.metadata?.poolType === 'skip_tap' ? (
                    /* Skip Tap Game - タップゲーム形式 */
                    <SkipTapGame
                        key={`skip_tap_${currentIndex}`}
                        step={currentQ.metadata.step}
                        from={currentQ.metadata.from}
                        to={currentQ.metadata.to}
                        totalNumbers={currentQ.metadata.totalNumbers || 12}
                        timeLimit={currentQ.metadata.timeLimit || 15}
                        onComplete={(allCorrect: boolean, _score: number, _total: number) => {
                            // Stop timer
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;

                            setFeedback(allCorrect ? 'correct' : 'incorrect');

                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: allCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);

                                if (!allCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id,
                                        mistakeCount: 1,
                                        lastMistakeAt: Date.now(),
                                        solvedCount: 0,
                                        data: currentQ
                                    }]);
                                }

                                // Check if there are more questions
                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                    startQuestionTimer();
                                } else {
                                    // All questions done - finish the game
                                    finishGame(newResults);
                                }
                            }, 1500);
                        }}
                    />
                ) : currentQ.metadata?.format === 'sequence_boxes' ? (
                    /* Skip Count Boxes - 連続入力ボックス形式 */
                    <SkipCountBoxes
                        ref={skipCountBoxesRef}
                        step={currentQ.metadata.step}
                        from={currentQ.metadata.sequence[0]}
                        to={currentQ.metadata.sequence[currentQ.metadata.sequence.length - 1]}
                        prefilled={currentQ.metadata.showNumbers || []}
                        onComplete={(allCorrect: boolean, _mistakes: number[]) => {
                            // Stop timer
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;

                            setFeedback(allCorrect ? 'correct' : 'incorrect');

                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: allCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);

                                if (!allCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id,
                                        mistakeCount: 1,
                                        lastMistakeAt: Date.now(),
                                        solvedCount: 0,
                                        data: currentQ
                                    }]);
                                }

                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                    startQuestionTimer();
                                } else {
                                    // All done
                                    finishGame(newResults);
                                }
                            }, 1000);
                        }}
                    />
                ) : currentQ.type === 'fill' ? (
                    <div className="w-full">
                        {/* Check if subtraction or addition based on metadata */}
                        {currentQ.metadata?.minuend ? (
                            <SakuranboSubVisual
                                question={currentQ}
                                steps={sakuranboSteps}
                                activeStep={sakuranboStepIndex}
                                shake={shake}
                                expectedValues={{
                                    step1: currentQ.metadata?.step1 ?? 0,
                                    step2: currentQ.metadata?.step2 ?? 0,
                                    answer: currentQ.answer
                                }}
                            />
                        ) : (
                            <SakuranboVisual
                                question={currentQ}
                                steps={sakuranboSteps}
                                activeStep={sakuranboStepIndex}
                                shake={shake}
                                expectedValues={{
                                    complement: currentQ.metadata?.complement ?? 0,
                                    remainder: currentQ.metadata?.remainder ?? 0,
                                    answer: currentQ.answer
                                }}
                            />
                        )}
                    </div>
                ) : (currentQ.metadata?.poolType === 'written_add_2d2d' || currentQ.metadata?.poolType === 'written_verify') ? (
                    <WrittenCalcInput
                        key={`written_calc_${currentIndex}`}
                        ref={writtenCalcInputRef}
                        question={currentQ}
                        onComplete={(isCorrect: boolean) => {
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;
                            setFeedback(isCorrect ? 'correct' : 'incorrect');
                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: isCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);
                                if (!isCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id, mistakeCount: 1, lastMistakeAt: Date.now(), solvedCount: 0, data: currentQ
                                    }]);
                                    const mistakeCount = newResults.filter(r => !r.correct).length;
                                    if (mistakeCount >= 2) { finishGame(newResults); return; }
                                }
                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1); startQuestionTimer();
                                } else { finishGame(newResults); }
                            }, 500);
                        }}
                    />
                ) : (currentQ.metadata?.poolType === 'carry_mark_tap') ? (
                    <CarryMarkTap
                        key={`carry_mark_${currentIndex}`}
                        question={currentQ}
                        onComplete={(isCorrect: boolean) => {
                            if (timerRef.current) clearInterval(timerRef.current);
                            const timeTaken = (Date.now() - qTimeRef.current) / 1000;
                            setFeedback(isCorrect ? 'correct' : 'incorrect');
                            setTimeout(() => {
                                const newResults = [...results, { q: currentQ, correct: isCorrect, time: timeTaken }];
                                setResults(newResults);
                                setFeedback(null);
                                if (!isCorrect) {
                                    setMistakes(prev => [...prev, {
                                        questionId: currentQ.id, mistakeCount: 1, lastMistakeAt: Date.now(), solvedCount: 0, data: currentQ
                                    }]);
                                }
                                if (currentIndex < questions.length - 1) {
                                    setCurrentIndex(prev => prev + 1); startQuestionTimer();
                                } else { finishGame(newResults); }
                            }, 500);
                        }}
                    />
                ) : (
                    <StandardInputPrompt
                        question={currentQ}
                        currentInput={currentInput}
                        feedback={feedback}
                    />
                )}

                {/* Visual Aid for Ten Complement (Only strictly for ten_comp type if needed, or if visual requested) */}
                {currentQ.metadata?.items && currentQ.id.startsWith("ten_comp") && (
                    <div className="mt-8 w-full max-w-[300px]">
                        <TenBlockVisual base={currentQ.metadata.items[0]} userInput={currentInput} />
                    </div>
                )}

                {/* 大きなフィードバック - 掛け算以外で表示 */}
                {feedback && !currentQ.text.includes('×') && (
                    <div className={`absolute inset-0 flex items-center justify-center z-10 bg-white/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200`}>
                        {feedback === 'correct' ? (
                            <div className="text-[150px] text-red-500 leading-none">⭕️</div>
                        ) : (
                            <div className="text-[150px] text-blue-500 leading-none">❌</div>
                        )}
                    </div>
                )}
            </div>

            {/* NumberPad - hide for skip_tap */}
            {currentQ?.metadata?.poolType !== 'skip_tap' && (
                <div className={`bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-8 pt-4 transition-all duration-300 ${inputReady ? 'translate-y-0' : 'translate-y-full'}`}>
                    <NumberPad onInput={handleInput} />
                </div>
            )}
        </div >
    );
}

function ResultScreen({ passed, results, mistakes, stageId, onRetry, onNext }: any) {
    const { recordStageResult } = useGame();
    useEffect(() => {
        const totalTime = results.reduce((acc: number, r: any) => acc + r.time, 0);
        recordStageResult(stageId, passed, totalTime, mistakes);
    }, []);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${passed ? 'bg-yellow-50' : 'bg-blue-50'}`}>
            <h1 className="text-5xl font-black mb-4 animate-bounce">
                {passed ? "合格！🎉" : "不合格..."}
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm mb-8 space-y-4">
                <div className="flex justify-between items-center text-lg border-b pb-2">
                    <span className="text-slate-500">正解数</span>
                    <span className="font-bold text-2xl">
                        {results.filter((r: any) => r.correct).length} / {results.length}
                    </span>
                </div>

                {mistakes.length > 0 && (
                    <div>
                        <p className="text-red-500 font-bold mb-2">間違えた問題</p>
                        <div className="flex flex-wrap gap-2">
                            {mistakes.map((m: any, i: number) => (
                                <span key={i} className="bg-red-100 text-red-600 px-2 py-1 rounded font-mono font-bold">
                                    {m.data.text}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4 w-full max-w-xs">
                {passed ? (
                    <button onClick={onNext} className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-600 active:scale-95 text-xl">
                        次のステージへ
                    </button>
                ) : (
                    <button onClick={onRetry} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-600 active:scale-95 text-xl">
                        もう一回やる
                    </button>
                )}

                <Link to="/stages" className="block text-center text-slate-400 hover:text-slate-600 py-2">
                    ステージ一覧へ
                </Link>
            </div>
        </div>
    )
}
