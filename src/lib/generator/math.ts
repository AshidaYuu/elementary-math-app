
import { AddPairsPool, AddThreeNumbersPool, TenComplementPool, Question, Add2D1DPool, Add1D2DPool, StairAdditionPool, AddCarryProcedurePool, SubPairsPool, SubBorrowProcedurePool, SubStairPool, Sub2D1DPool, SubAddMixedPool, SkipCountPool, ElevAddPool, MulLinkPool, MulTablePool, MulReviewPool, MulMixPool } from "@/types/curriculum";

// Helper: Random Integer [min, max]
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Shuffle Array
export function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

// 1. Ten Complement
export function generateTenComplement(spec: TenComplementPool, count: number): Question[] {
    const questions: Question[] = [];
    // For SEQ, the caller handles sequencing. For RND:
    for (let i = 0; i < count; i++) {
        const num = spec.numbers[randomInt(0, spec.numbers.length - 1)];
        const answer = 10 - num;
        questions.push({
            id: `ten_comp_${num}_${i}_${Date.now()}`,
            text: `${num} + ? = 10`,
            answer: answer.toString(),
            type: 'input',
            metadata: { items: [num] }
        });
    }
    return questions;
}

// 2. Add Pairs (1D + 1D)
export function generateAddPairs(spec: AddPairsPool, count: number): Question[] {
    const questions: Question[] = [];
    let attempts = 0;

    while (questions.length < count && attempts < count * 10) {
        attempts++;
        const a = randomInt(spec.aRange[0], spec.aRange[1]);
        const b = randomInt(spec.bRange[0], spec.bRange[1]);
        const sum = a + b;

        // Constraints
        if (spec.constraints) {
            if (spec.constraints.sumMax !== undefined && sum > spec.constraints.sumMax) continue;
            if (spec.constraints.sumMin !== undefined && sum < spec.constraints.sumMin) continue;
            if (spec.constraints.onesNoCarry && a % 10 + b % 10 >= 10) continue; // Not exactly right for 1D, but handles general logic
        }

        // Normalization (Commutative) for distinct ID checking (not implemented fully here, but good for weakness)

        questions.push({
            id: `add_pair_${a}_${b}_${questions.length}_${Date.now()}`,
            text: `${a} + ${b}`,
            answer: sum.toString(),
            type: 'input'
        });
    }
    return questions;
}

// 3. Add Three Numbers
export function generateAddThreeNumbers(spec: AddThreeNumbersPool, count: number): Question[] {
    const questions: Question[] = [];
    // Simplified implementation for RND
    for (let i = 0; i < count; i++) {
        let nums: number[] = [];
        if (spec.template === 'make10_visible' && spec.pairs) {
            // Pick a pair that makes 10
            const pair = spec.pairs[randomInt(0, spec.pairs.length - 1)];
            const third = randomInt(spec.thirdRange![0], spec.thirdRange![1]);
            nums = [pair[0], pair[1], third];
            // Logic to maybe shuffle position if needed? usually "visible" means 10 is easy to see
        } else if (spec.template === 'make10_find' || spec.template === 'mixed') {
            // Generate randoms but ensure constraints
            const a = randomInt(spec.aRange![0], spec.aRange![1]);
            const b = randomInt(spec.bRange![0], spec.bRange![1]);
            const c = randomInt(spec.cRange![0], spec.cRange![1]);
            nums = [a, b, c];
            // TODO: Enforce "mustContainMake10Pair"
            if (spec.constraints?.mustContainMake10Pair) {
                // Force a pair to sum to 10
                const p1 = randomInt(1, 9);
                const p2 = 10 - p1;
                const p3 = randomInt(1, 9);
                nums = [p1, p2, p3];
            }
        }

        // Shuffle nums for display if RND, unless fixedOrder is requested
        if (!spec.constraints?.fixedOrder && Math.random() > 0.5) nums = shuffle(nums);

        questions.push({
            id: `add_3num_${nums.join('_')}_${i}`,
            text: `${nums[0]} + ${nums[1]} + ${nums[2]}`,
            answer: (nums[0] + nums[1] + nums[2]).toString(),
            type: 'input'
        });
    }
    return questions;
}

// 4. Stair Addition
export function generateStairAddition(spec: StairAdditionPool, count: number): Question[] {
    // Generate questions that look like stair input
    // For now, treat as single questions "2+3, 3+4..." displayed normally, 
    // or return a special "type": "grid" that UI handles. Used "input" for MVP simple mode.
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
        const base = spec.baseNumbers[randomInt(0, spec.baseNumbers.length - 1)];
        // Just random addition with base?
        // "Stair" usually means a grid. 
        // MVP: Just generate standard addition questions fitting the constraint
        const other = randomInt(1, spec.topRowLength);
        questions.push({
            id: `stair_${base}_${other}_${i}`,
            text: `${base} + ${other}`,
            answer: (base + other).toString(),
            type: 'input'
        });
    }
    return questions;
}

// 5. Add 2D + 1D
export function generateAdd2D1D(spec: Add2D1DPool, count: number): Question[] {
    const questions: Question[] = [];
    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const a = randomInt(spec.twoDigitRange[0], spec.twoDigitRange[1]);
        const b = randomInt(spec.oneDigitRange[0], spec.oneDigitRange[1]);
        const sum = a + b;

        if (spec.constraints?.onesNoCarry && (a % 10 + b >= 10)) continue;
        if (spec.constraints?.onesCarry && (a % 10 + b < 10)) continue;
        if (spec.constraints?.sumMax && sum > spec.constraints.sumMax) continue;

        questions.push({
            id: `add_2d1d_${a}_${b}_${questions.length}`,
            text: `${a} + ${b}`,
            answer: sum.toString(),
            type: 'input'
        });
    }
    return questions;
}

// 6. Add 1D + 2D
export function generateAdd1D2D(spec: Add1D2DPool, count: number): Question[] {
    const questions: Question[] = [];
    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const a = randomInt(spec.oneDigitRange[0], spec.oneDigitRange[1]);
        const b = randomInt(spec.twoDigitRange[0], spec.twoDigitRange[1]);
        const sum = a + b;

        if (spec.constraints?.sumMax && sum > spec.constraints.sumMax) continue;

        questions.push({
            id: `add_1d2d_${a}_${b}_${questions.length}`,
            text: `${a} + ${b}`,
            answer: sum.toString(),
            type: 'input'
        });
    }
    return questions;
}

// 7. Carry Procedure (Fill)
export function generateAddCarryProcedure(spec: AddCarryProcedurePool, count: number, isSequential: boolean = false): Question[] {
    const questions: Question[] = [];

    if (isSequential) {
        // Generate all valid pairs in order
        for (let a = spec.aRange[0]; a <= spec.aRange[1]; a++) {
            for (let b = spec.bRange[0]; b <= spec.bRange[1]; b++) {
                if (a + b <= 10) continue; // Skip non-carry
                if (spec.constraints?.sumMax && (a + b) > spec.constraints.sumMax) continue;
                if (spec.constraints?.sumMin && (a + b) < spec.constraints.sumMin) continue;

                questions.push({
                    id: `proc_${a}_${b}_seq`,
                    text: `${a} + ${b}`,
                    answer: (a + b).toString(),
                    type: 'fill',
                    metadata: {
                        splitHost: a,
                        splitGuest: b,
                        complement: 10 - a,
                        remainder: b - (10 - a),
                        sakuranboMode: spec.variant
                    }
                });
            }
        }
        // Slice to requested count (though usually count should match total items for sequential)
        return questions.slice(0, count);
    }

    let attempts = 0;
    // 8 + 7 = 15
    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const a = randomInt(spec.aRange[0], spec.aRange[1]);
        const b = randomInt(spec.bRange[0], spec.bRange[1]);
        if (a + b <= 10) continue; // Must carry AND not be exactly 10 (remainder would be 0)

        // Check constraints
        if (spec.constraints?.sumMax && (a + b) > spec.constraints.sumMax) continue;
        if (spec.constraints?.sumMin && (a + b) < spec.constraints.sumMin) continue;

        questions.push({
            id: `proc_${a}_${b}_${questions.length}`,
            text: `${a} + ${b}`,
            answer: (a + b).toString(),
            type: 'fill', // UI should handle this specially if possible
            metadata: {
                splitHost: a,
                splitGuest: b,
                complement: 10 - a,
                remainder: b - (10 - a),
                sakuranboMode: spec.variant
            }
        });
    }
    return questions;
}


// 9. Subtraction Pairs
export function generateSubPairs(spec: SubPairsPool, count: number, isSequential: boolean = false): Question[] {
    const questions: Question[] = [];

    if (isSequential) {
        for (let m = spec.minuendRange[0]; m <= spec.minuendRange[1]; m++) {
            for (let s = spec.subtrahendRange[0]; s <= spec.subtrahendRange[1]; s++) {
                if (m - s < 0) continue;
                if (spec.constraints?.resultMin !== undefined && (m - s) < spec.constraints.resultMin) continue;
                if (spec.constraints?.resultMax !== undefined && (m - s) > spec.constraints.resultMax) continue;

                questions.push({
                    id: `sub_pair_${m}_${s}_seq`,
                    text: `${m} - ${s}`,
                    answer: (m - s).toString(),
                    type: 'input'
                });
            }
        }
        return questions.slice(0, count);
    }

    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const minuend = randomInt(spec.minuendRange[0], spec.minuendRange[1]);
        const subtrahend = randomInt(spec.subtrahendRange[0], spec.subtrahendRange[1]);

        if (minuend - subtrahend < 0) continue; // No negative results
        if (spec.constraints?.resultMin !== undefined && (minuend - subtrahend) < spec.constraints.resultMin) continue;
        if (spec.constraints?.resultMax !== undefined && (minuend - subtrahend) > spec.constraints.resultMax) continue;

        questions.push({
            id: `sub_pair_${minuend}_${subtrahend}_${questions.length}`,
            text: `${minuend} - ${subtrahend}`,
            answer: (minuend - subtrahend).toString(),
            type: 'input'
        });
    }
    return questions;
}

// 10. Subtraction Borrow Procedure (Genka-ho: 13-9 -> 10-9=1, 1+3=4)
export function generateSubBorrowProcedure(spec: SubBorrowProcedurePool, count: number, isSequential: boolean = false): Question[] {
    const questions: Question[] = [];

    if (isSequential) {
        for (let m = spec.minuendRange[0]; m <= spec.minuendRange[1]; m++) {
            for (let s = spec.subtrahendRange[0]; s <= spec.subtrahendRange[1]; s++) {
                if (m - s < 0) continue;
                if (m < 10) continue; // Borrow usually implies minuend >= 10 and unit < subtrahend
                const unit = m % 10;
                if (unit >= s) continue; // No borrow needed if unit >= subtrahend (e.g. 15 - 3)

                questions.push(createSubBorrowQuestion(m, s, spec.variant, "seq"));
            }
        }
        return questions.slice(0, count);
    }

    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const m = randomInt(spec.minuendRange[0], spec.minuendRange[1]);
        const s = randomInt(spec.subtrahendRange[0], spec.subtrahendRange[1]);

        if (m - s < 0) continue;
        const unit = m % 10;
        // For borrow procedure, we ALWAYS require borrow (unit < subtrahend)
        if (m < 10) continue;
        if (unit >= s) continue; // Skip if no borrow needed (e.g. 15 - 4, 13 - 2)

        questions.push(createSubBorrowQuestion(m, s, spec.variant, questions.length.toString()));
    }
    return questions;
}

function createSubBorrowQuestion(m: number, s: number, variant: string | undefined, idSuffix: string): Question {
    // Genka-ho: 13 - 9
    // Split 13 -> 10 + 3
    // 10 - 9 = 1
    // 1 + 3 = 4
    const unit = m % 10;
    const step1 = 10 - s; // 10 - 9 = 1
    const step2 = step1 + unit; // 1 + 3 = 4

    return {
        id: `sub_proc_${m}_${s}_${idSuffix}`,
        text: `${m} - ${s}`,
        answer: (m - s).toString(),
        type: 'fill',
        metadata: {
            minuend: m,
            subtrahend: s,
            splitHost: 10,
            splitGuest: unit,
            step1: step1,
            step2: step2,
            sakuranboMode: variant
        }
    };
}

// 11. Subtraction Stair
export function generateSubStair(spec: SubStairPool, count: number): Question[] {
    const questions: Question[] = [];
    // Similar to addition stair but subtraction
    // e.g.   5  6  7  8
    //     -3
    //      2  3  4  5
    for (let i = 0; i < count; i++) {
        const base = spec.baseNumbers[randomInt(0, spec.baseNumbers.length - 1)];
        // Ensure top row numbers are adaptable to the base (subtrahend)
        // Usually top row are minuends? Or top row is subtrahend?
        // Standard "Stair Subtraction" usually means:
        // Top row: Minuends (e.g. 11, 12, 13...)
        // Left col: Subtrahend (e.g. -9)
        // Or vice versa. Let's assume Top Row = Minuends, and we subtract a constant.
        // But the spec might define otherwise.
        // Let's assume generating a random sequence.

        // Simplified: Generate random top row numbers that are >= base
        // If base is the subtrahend (e.g. 3)
        // Top row numbers: 4, 5, 6, 7...

        // Wait, spec.baseNumbers implies the 'constant' part.
        // Let's assume base is the subtrahend.
        const subtrahend = base; // Fixed for this drill
        const startMinuend = randomInt(subtrahend + 1, subtrahend + 5);

        const row = [];
        for (let k = 0; k < spec.topRowLength; k++) {
            row.push(startMinuend + k);
        }

        questions.push({
            id: `sub_stair_${subtrahend}_${i}`,
            text: `stair:${subtrahend}`, // Frontend needs to render grid
            answer: row.map(m => (m - subtrahend).toString()).join(','),
            type: 'input', // Grid input
            metadata: {
                row: row, // Top row numbers
                operator: '-',
                base: subtrahend
            }
        });
    }
    return questions;
}

// 12. Subtraction 2D - 1D
export function generateSub2D1D(spec: Sub2D1DPool, count: number): Question[] {
    const questions: Question[] = [];
    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const m = randomInt(spec.twoDigitRange[0], spec.twoDigitRange[1]);
        const s = randomInt(spec.oneDigitRange[0], spec.oneDigitRange[1]);

        if (m - s < 0) continue;
        const unit = m % 10;

        // Constraints
        if (spec.constraints?.noBorrow && unit < s) continue; // Require no borrow (e.g. 15 - 3)
        if (spec.constraints?.borrow && unit >= s) continue; // Require borrow (e.g. 13 - 5)

        questions.push({
            id: `sub_2d1d_${m}_${s}_${questions.length}`,
            text: `${m} - ${s}`,
            answer: (m - s).toString(),
            type: 'input'
        });
    }
    return questions;
}

// 13. Subtraction-Addition Mixed (10 - a + b format)
export function generateSubAddMixed(spec: SubAddMixedPool, count: number): Question[] {
    const questions: Question[] = [];
    let attempts = 0;

    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const base = spec.base || 10;
        const a = randomInt(spec.subtrahendRange[0], spec.subtrahendRange[1]);
        const b = randomInt(spec.addendRange[0], spec.addendRange[1]);

        const result = base - a + b;

        // Ensure result is positive
        if (result < 0) continue;

        questions.push({
            id: `sub_add_${base}_${a}_${b}_${questions.length}`,
            text: `${base} - ${a} + ${b}`,
            answer: result.toString(),
            type: 'input'
        });
    }
    return questions;
}

// ============================================
// Multiplication (九九) Generators
// ============================================

// 14. Skip Count (N飛びカウント) - 連続マス目形式
// e.g., 2 → 4 → □ → 8 → □ → □ → □ → □ → 18 (複数空欄を順番に埋める)
export function generateSkipCount(spec: SkipCountPool, count: number): Question[] {
    const questions: Question[] = [];
    const sequence: number[] = [];

    // Build the full sequence
    for (let n = spec.from; n <= spec.to; n += spec.step) {
        sequence.push(n);
    }

    // showNumbers: 表示する位置の数字（それ以外は空欄）
    const showNumbers = (spec as any).showNumbers || [spec.from, spec.to];

    // 空欄の位置と答えを特定
    const blanks: { index: number; value: number }[] = [];
    sequence.forEach((val, idx) => {
        if (!showNumbers.includes(val)) {
            blanks.push({ index: idx, value: val });
        }
    });

    // 1問の中で複数の空欄を順番に回答する形式
    // 最初の空欄から順番に回答する
    for (let i = 0; i < blanks.length && questions.length < count; i++) {
        const blank = blanks[i];

        // 現在の状態を表示（既に回答した空欄は表示、未回答は□）
        const displayParts = sequence.map((val, idx) => {
            if (showNumbers.includes(val)) {
                return val.toString();
            } else if (idx < blank.index && blanks.some(b => b.index === idx)) {
                // 既に回答済みの空欄は数字を表示
                return val.toString();
            } else if (idx === blank.index) {
                return '□';
            } else {
                return '□';
            }
        });

        questions.push({
            id: `skip_${spec.step}_${blank.index}_${i}`,
            text: displayParts.join(' → '),
            answer: blank.value.toString(),
            type: 'input',
            metadata: {
                step: spec.step,
                sequence: sequence,
                blankIndex: blank.index,
                showNumbers: showNumbers,
                format: 'sequence_boxes'
            }
        });
    }

    return questions;
}

// 15. Elevator Addition (エレベーター足し算) - 順番通り
// 0+2=2, 2+2=4, 4+2=6, ..., 16+2=18
export function generateElevAdd(spec: ElevAddPool, count: number): Question[] {
    const questions: Question[] = [];
    const [minStep, maxStep] = spec.stepsRange;

    // 順番通りに生成
    for (let stepNum = minStep; stepNum <= maxStep && questions.length < count; stepNum++) {
        const current = spec.start + (stepNum - 1) * spec.add;
        const answer = current + spec.add;

        questions.push({
            id: `elev_add_${spec.add}_${stepNum}`,
            text: `${current} + ${spec.add}`,
            answer: answer.toString(),
            type: 'input',
            metadata: { step: stepNum, addend: spec.add, format: 'equation' }
        });
    }

    return questions;
}

// 16. Multiplication Link (足し算⇄掛け算リンク)
// e.g., 2+2+2 = 2×? or 2×3 = 2+2+?
export function generateMulLink(spec: MulLinkPool, count: number): Question[] {
    const questions: Question[] = [];
    const [min, max] = spec.range;

    for (let i = 0; i < count; i++) {
        const multiplier = randomInt(min, max);
        const product = spec.n * multiplier;

        // Decide direction based on spec
        let isAddToMul: boolean;
        if (spec.direction === 'add_to_mul') {
            isAddToMul = true;
        } else if (spec.direction === 'mul_to_add') {
            isAddToMul = false;
        } else {
            isAddToMul = Math.random() > 0.5;
        }

        if (isAddToMul) {
            // Display: 2+2+2 = 2×? (answer is multiplier)
            const additionParts = Array(multiplier).fill(spec.n.toString()).join('+');
            questions.push({
                id: `mul_link_atm_${spec.n}_${multiplier}_${i}`,
                text: `${additionParts} = ${spec.n}×□`,
                answer: multiplier.toString(),
                type: 'input',
                metadata: { n: spec.n, multiplier, direction: 'add_to_mul' }
            });
        } else {
            // Display: 2×3 = 2+2+? (answer is spec.n)
            const partialAddition = Array(multiplier - 1).fill(spec.n.toString()).join('+');
            questions.push({
                id: `mul_link_mta_${spec.n}_${multiplier}_${i}`,
                text: `${spec.n}×${multiplier} = ${partialAddition}+□`,
                answer: spec.n.toString(),
                type: 'input',
                metadata: { n: spec.n, multiplier, direction: 'mul_to_add' }
            });
        }
    }
    return questions;
}

// 17. Multiplication Table (九九問題)
// e.g., 2×3 = ?
export function generateMulTable(spec: MulTablePool, count: number, isSequential: boolean = false): Question[] {
    const questions: Question[] = [];
    const [min, max] = spec.range;

    if (isSequential || spec.order === 'asc') {
        // Generate in order: n×1, n×2, n×3, ... and repeat 3 times
        const repeatCount = 3;
        for (let repeat = 0; repeat < repeatCount && questions.length < count; repeat++) {
            for (let m = min; m <= max && questions.length < count; m++) {
                questions.push({
                    id: `mul_table_${spec.n}_${m}_r${repeat}`,
                    text: `${spec.n}×${m}`,
                    answer: (spec.n * m).toString(),
                    type: 'input',
                    metadata: { n: spec.n, m }
                });
            }
        }
    } else {
        // Random order
        for (let i = 0; i < count; i++) {
            const m = randomInt(min, max);
            questions.push({
                id: `mul_table_${spec.n}_${m}_${i}`,
                text: `${spec.n}×${m}`,
                answer: (spec.n * m).toString(),
                type: 'input',
                metadata: { n: spec.n, m }
            });
        }
    }

    return questions;
}

// 18. Multiplication Review (復習 - 複数段)
// e.g., 2~5の段からランダムに出題
export function generateMulReview(spec: MulReviewPool, count: number): Question[] {
    const questions: Question[] = [];
    const [min, max] = spec.range;
    const minPerN = spec.distribution?.minPerN || 0;

    // First, ensure minPerN questions from each N
    if (minPerN > 0) {
        for (let n = spec.fromN; n <= spec.toN; n++) {
            for (let j = 0; j < minPerN && questions.length < count; j++) {
                const m = randomInt(min, max);
                questions.push({
                    id: `mul_review_${n}_${m}_${questions.length}`,
                    text: `${n}×${m}`,
                    answer: (n * m).toString(),
                    type: 'input',
                    metadata: { n, m }
                });
            }
        }
    }

    // Fill remaining with random from all N in range
    while (questions.length < count) {
        const n = randomInt(spec.fromN, spec.toN);
        const m = randomInt(min, max);
        questions.push({
            id: `mul_review_${n}_${m}_${questions.length}`,
            text: `${n}×${m}`,
            answer: (n * m).toString(),
            type: 'input',
            metadata: { n, m }
        });
    }

    // Shuffle to mix
    return shuffle(questions);
}

// 19. Multiplication Mix (全段ミックス)
// e.g., 2~9の段からランダムに出題
export function generateMulMix(spec: MulMixPool, count: number): Question[] {
    const questions: Question[] = [];
    const [min, max] = spec.range;

    for (let i = 0; i < count; i++) {
        const n = randomInt(spec.fromN, spec.toN);
        const m = randomInt(min, max);
        questions.push({
            id: `mul_mix_${n}_${m}_${i}`,
            text: `${n}×${m}`,
            answer: (n * m).toString(),
            type: 'input',
            metadata: { n, m }
        });
    }

    return questions;
}

// 20. Skip Tap Game (2とびタップ)
// タップゲーム形式の問題を生成
export interface SkipTapPool {
    type: 'skip_tap';
    step: number;           // 2 for 2とび
    from: number;           // Starting number (2)
    to: number;             // Ending number (18)
    totalNumbers?: number;  // Total numbers to display
    timeLimit?: number;     // Time limit in seconds
}

export function generateSkipTap(spec: SkipTapPool, count: number): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        questions.push({
            id: `skip_tap_${spec.step}_${i}_${Date.now()}`,
            text: `${spec.step}とびの数をタップ`,
            answer: '', // No single answer, handled by component
            type: 'tap',
            metadata: {
                poolType: 'skip_tap',
                step: spec.step,
                from: spec.from,
                to: spec.to,
                totalNumbers: spec.totalNumbers || 12,
                timeLimit: spec.timeLimit || 15
            }
        });
    }

    return questions;
}

// ============================================
// Written Calculation (筆算) Generators
// ============================================

import { PlaceValue2DPool, PlaceValue3DPool, WrittenFormFillPool, WrittenFormChoicePool, WrittenAdd2D2DPool, CarryMarkTapPool, WrittenVerifyPool } from "@/types/curriculum";

// 21. 位取りトレーニング（2桁）
// 数字を「十の位」「一の位」に分解する
export function generatePlaceValue2D(spec: PlaceValue2DPool, count: number): Question[] {
    const questions: Question[] = [];
    const usedNumbers = new Set<number>();
    let lastTens = -1;
    let tensStreak = 0;

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let num: number;

        do {
            num = randomInt(spec.range[0], spec.range[1]);
            const tens = Math.floor(num / 10);

            // 同じ十の位が3回以上続かないようにする
            if (tens === lastTens) {
                tensStreak++;
                if (tensStreak >= 3) continue;
            } else {
                tensStreak = 1;
                lastTens = tens;
            }

            attempts++;
        } while (usedNumbers.has(num) && attempts < 50);

        usedNumbers.add(num);

        const tens = Math.floor(num / 10);
        const ones = num % 10;

        questions.push({
            id: `pv_2d_${num}_${i}_${Date.now()}`,
            text: num.toString(),
            answer: `${tens},${ones}`, // 正解は "4,7" 形式
            type: 'place_value',
            metadata: {
                poolType: 'place_value_2d',
                number: num,
                tens: tens,
                ones: ones
            }
        });
    }

    return questions;
}

// 22. 位取りトレーニング（3桁）
export function generatePlaceValue3D(spec: PlaceValue3DPool, count: number): Question[] {
    const questions: Question[] = [];
    const usedNumbers = new Set<number>();

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let num: number;

        do {
            num = randomInt(spec.range[0], spec.range[1]);

            // 中間の0を含む数を一定割合で生成
            if (spec.includeZeroMiddle && Math.random() < 0.3 && attempts < 20) {
                const hundreds = randomInt(1, 9);
                const ones = randomInt(0, 9);
                num = hundreds * 100 + ones; // 例: 405
            }

            attempts++;
        } while (usedNumbers.has(num) && attempts < 50);

        usedNumbers.add(num);

        const hundreds = Math.floor(num / 100);
        const tens = Math.floor((num % 100) / 10);
        const ones = num % 10;

        questions.push({
            id: `pv_3d_${num}_${i}_${Date.now()}`,
            text: num.toString(),
            answer: `${hundreds},${tens},${ones}`,
            type: 'place_value',
            metadata: {
                poolType: 'place_value_3d',
                number: num,
                hundreds: hundreds,
                tens: tens,
                ones: ones,
                hasZeroMiddle: tens === 0
            }
        });
    }

    return questions;
}

export function generateWrittenFormFill(spec: WrittenFormFillPool, count: number): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const a = randomInt(spec.operandARange[0], spec.operandARange[1]);
        const b = randomInt(spec.operandBRange[0], spec.operandBRange[1]);

        questions.push({
            id: `wf_fill_${a}_${b}_${i}_${Date.now()}`,
            text: `${a} + ${b}`,
            answer: a < 10 ? 'ones' : 'tens', // 1桁は一の位に揃える
            type: 'written_form_fill',
            metadata: {
                poolType: 'written_form_fill',
                format: spec.format,
                topNumber: a,
                bottomNumber: b,
                topDigits: a.toString().split('').map(Number),
                bottomDigits: b.toString().split('').map(Number)
            }
        });
    }

    return questions;
}

// 24. 筆算フォーム選択
export function generateWrittenFormChoice(spec: WrittenFormChoicePool, count: number): Question[] {
    const questions: Question[] = [];
    const errorTypes = spec.errorTypes || ['right_shift', 'left_shift', 'blank_shift'];

    for (let i = 0; i < count; i++) {
        const a = randomInt(spec.operandARange[0], spec.operandARange[1]);
        const b = randomInt(spec.operandBRange[0], spec.operandBRange[1]);

        // 3つの選択肢を生成（正解1つ + 誤り2つ）
        const correctIndex = randomInt(0, 2);
        const choices: { layout: string; isCorrect: boolean }[] = [];

        for (let j = 0; j < 3; j++) {
            if (j === correctIndex) {
                choices.push({ layout: 'correct', isCorrect: true });
            } else {
                const errorType = errorTypes[randomInt(0, errorTypes.length - 1)];
                choices.push({ layout: errorType, isCorrect: false });
            }
        }

        questions.push({
            id: `wf_choice_${a}_${b}_${i}_${Date.now()}`,
            text: `${a} + ${b}`,
            answer: correctIndex.toString(),
            type: 'written_form_choice',
            metadata: {
                poolType: 'written_form_choice',
                topNumber: a,
                bottomNumber: b,
                choices: choices,
                correctIndex: correctIndex
            }
        });
    }

    return questions;
}

// 26. 繰り上がりマーク練習

export function generateWrittenAdd2D2D(spec: WrittenAdd2D2DPool, count: number): Question[] {
    const questions: Question[] = [];
    let attempts = 0;

    while (questions.length < count && attempts < count * 20) {
        attempts++;
        const a = randomInt(spec.aRange[0], spec.aRange[1]);
        const b = randomInt(spec.bRange[0], spec.bRange[1]);
        const sum = a + b;

        const onesSum = (a % 10) + (b % 10);
        const hasCarry = onesSum >= 10;

        // 繰り上がり制約のチェック
        if (spec.carryRequired && !hasCarry) continue;

        // 繰り上がりなし（noCarry）の場合
        // 1. 一の位の繰り上がり禁止
        if (spec.noCarry && hasCarry) continue;
        // 2. 十の位の繰り上がり（百の位への繰り上がり）禁止 -> 和が100未満であること
        if (spec.noCarry && sum >= 100) continue;

        const tensSum = Math.floor(a / 10) + Math.floor(b / 10) + (hasCarry ? 1 : 0);

        questions.push({
            id: `wa_2d2d_${a}_${b}_${questions.length}_${Date.now()}`,
            text: `${a} + ${b}`,
            answer: sum.toString(),
            type: 'written_add',
            metadata: {
                poolType: 'written_add_2d2d',
                a: a,
                b: b,
                sum: sum,
                aOnes: a % 10,
                aTens: Math.floor(a / 10),
                bOnes: b % 10,
                bTens: Math.floor(b / 10),
                onesSum: onesSum,
                tensSum: tensSum,
                hasCarry: hasCarry,
                carryValue: hasCarry ? 1 : 0,
                answerOnes: sum % 10,
                answerTens: Math.floor((sum % 100) / 10),
                answerHundreds: sum >= 100 ? Math.floor(sum / 100) : null,
                inputOrder: spec.inputOrder || 'ones_first'
            }
        });
    }

    return questions;
}

// 26. 繰り上がりマーク練習
export function generateCarryMarkTap(spec: CarryMarkTapPool, count: number): Question[] {
    const questions: Question[] = [];
    const carryRatio = spec.carryRatio ?? 0.5;

    for (let i = 0; i < count; i++) {
        let a: number, b: number;
        const shouldHaveCarry = Math.random() < carryRatio;

        let attempts = 0;
        do {
            a = randomInt(spec.aRange[0], spec.aRange[1]);
            b = randomInt(spec.bRange[0], spec.bRange[1]);
            const onesSum = (a % 10) + (b % 10);
            const hasCarry = onesSum >= 10;

            if (shouldHaveCarry === hasCarry) break;
            attempts++;
        } while (attempts < 50);

        const onesSum = (a % 10) + (b % 10);
        const hasCarry = onesSum >= 10;

        questions.push({
            id: `cm_tap_${a}_${b}_${i}_${Date.now()}`,
            text: `${a} + ${b}`,
            answer: hasCarry ? 'tens' : 'none', // 繰り上がりがあれば「十の位」をタップ
            type: 'carry_mark_tap',
            metadata: {
                poolType: 'carry_mark_tap',
                a: a,
                b: b,
                hasCarry: hasCarry,
                carryPosition: hasCarry ? 'tens' : null
            }
        });
    }

    return questions;
}

// 27. 検算
export function generateWrittenVerify(spec: WrittenVerifyPool, count: number): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const a = randomInt(spec.aRange[0], spec.aRange[1]);
        const b = randomInt(spec.bRange[0], spec.bRange[1]);
        const sum = a + b;

        // Verify: Sum - A = B  or  Sum - B = A
        // Default to Sum - B = A
        const subtractA = spec.verifyType === 'subtract_a' || (spec.verifyType === 'random' && Math.random() < 0.5);

        const topNum = sum;
        const bottomNum = subtractA ? a : b;
        const answerNum = subtractA ? b : a;

        questions.push({
            id: `wv_${a}_${b}_${i}_${Date.now()}`,
            text: `${topNum} - ${bottomNum}`,
            answer: answerNum.toString(),
            type: 'written_verify',
            metadata: {
                poolType: 'written_verify',
                a: topNum,
                b: bottomNum,
                operator: '-',
                expectedAnswer: answerNum
            }
        });
    }

    return questions;
}
