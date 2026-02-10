import { Question } from "@/types/curriculum";
import { getKukuEquationReading, getKukuAnswerReading } from "@/lib/kukuReading";

interface StandardInputPromptProps {
    question: Question;
    currentInput: string;
    feedback?: 'correct' | 'incorrect' | null;
}

export function StandardInputPrompt({ question, currentInput, feedback }: StandardInputPromptProps) {
    const parts = question.text.split('=');
    const expression = parts[0];

    // 掛け算の読み方を取得
    const isMultiplication = expression.includes('×');
    let equationReading = '';
    let answerReading = '';

    if (isMultiplication) {
        const match = expression.match(/(\d+)×(\d+)/);
        if (match) {
            const n = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            equationReading = getKukuEquationReading(n, m);

            // 回答後に答えの読み方を追加
            if (feedback) {
                const answer = n * m;
                answerReading = getKukuAnswerReading(answer);
            }
        }
    }

    return (
        <div className="flex flex-col items-center justify-center mb-8 animate-in slide-in-from-right duration-300">
            {/* 九九読み方 - 掛け算の場合は常に表示 */}
            {equationReading && (
                <div className="text-2xl font-bold text-purple-500 mb-3">
                    <span>{equationReading}</span>
                    {feedback && answerReading && (
                        <span className="text-green-500 animate-in fade-in zoom-in duration-300">{answerReading}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-center space-x-3">
                <div className="text-5xl font-black text-slate-800 leading-none">
                    {expression}
                </div>
                <div className="text-3xl text-slate-300 font-bold">=</div>
                <div className="min-w-[60px] h-[60px] border-b-2 border-blue-200 flex items-center justify-center relative">
                    <span className={`text-5xl font-bold animate-in zoom-in duration-100 leading-tight ${feedback === 'correct' ? 'text-green-500' :
                            feedback === 'incorrect' ? 'text-red-500' :
                                'text-blue-600'
                        }`}>
                        {feedback === 'incorrect' ? question.answer : currentInput}
                    </span>

                    {/* 正解/不正解マーク - 入力欄の右横に小さく表示 */}
                    {feedback && (
                        <span className={`absolute -right-8 text-2xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {feedback === 'correct' ? '○' : '×'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
