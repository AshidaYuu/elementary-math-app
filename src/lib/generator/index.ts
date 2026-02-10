import { Stage, Question, WeakQuestion, PoolSpec, CompositePoolV2, SkipCountPool, ElevAddPool, MulLinkPool, MulTablePool, MulReviewPool, MulMixPool, PlaceValue2DPool, PlaceValue3DPool, WrittenFormFillPool, WrittenFormChoicePool, WrittenAdd2D2DPool, CarryMarkTapPool, WrittenVerifyPool } from "@/types/curriculum";
import {
    generateTenComplement,
    generateAddPairs,
    generateAddThreeNumbers,
    generateStairAddition,
    generateAdd2D1D,
    generateAdd1D2D,
    generateAddCarryProcedure,
    generateSubPairs,
    generateSubBorrowProcedure,
    generateSubStair,
    generateSub2D1D,
    generateSubAddMixed,
    generateSkipCount,
    generateElevAdd,
    generateMulLink,
    generateMulTable,
    generateMulReview,
    generateMulMix,
    generateSkipTap,
    SkipTapPool,
    // Written Calculation (筆算)
    generatePlaceValue2D,
    generatePlaceValue3D,
    generateWrittenFormFill,
    generateWrittenFormChoice,
    generateWrittenAdd2D2D,
    generateCarryMarkTap,
    generateWrittenVerify
} from "./math";

// Weighted Random Picker
function pickWeighted(weights: Record<string, number>): string {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (const [key, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) return key;
    }
    return Object.keys(weights)[0];
}

// Single Question Part Picker (for Composite/MIX)
export function generateSingleQuestionFromType(type: string, spec: PoolSpec): Question | null {
    // This is tricky because the generators return arrays. 
    // We can call generator with count=1.

    // Hardcoded mapping for now since spec.type might be 'composite' but we need the sub-specs.
    // In the JSON, composite refers to skillId/poolType. 
    // But the JSON provided structure for 'composite' is: "includes": ["NUM10_MAKE", ...], "weights": ...
    // We need to resolve "NUM10_MAKE" to a PoolSpec.
    // BUT, the JSON doesn't define the PoolSpecs separately from Stages.
    // So 'composite' in this specific JSON refers to OTHER STAGES' skillIds? 
    // Or we just hardcode the logic for "NUM10_MAKE" -> ten_complement.

    // For the MVP, I will implement a simpler lookup map if needed, 
    // OR, I'll rely on the `stage.skillId` being passed or standard types.

    // Let's assume for 'composite', we look at what "types" are available in our code.
    // The JSON `es_g1_add.json` uses "SkillId" in includes? 
    // "includes": [ "NUM10_MAKE", "ADD_1D_NO_CARRY" ... ]
    // We need a way to get the PoolSpec for those SkillIds.
    // This requires access to the full StageGraph or a lookup.
    // For now, I will Mock/Clone the specs from known types or just implement basic fallback.

    return null;
}

// Main Generator Factory
// Returns separate arrays for review questions and new questions
export interface GeneratedQuestions {
    reviewQuestions: Question[];
    newQuestions: Question[];
}

export function generateQuestionsForStage(stage: Stage, weakSet: WeakQuestion[]): GeneratedQuestions {
    const count = stage.round.questions;
    const pool = stage.poolSpec;

    // 1. Review Questions (from weakness set)
    let reviewQuestions: Question[] = [];
    if (stage.mode !== 'SEQ' && stage.mode !== 'FILL' && weakSet.length > 0) {
        // Use up to 30% of count or all weakSet questions (whichever is smaller)
        let weakCount = Math.min(Math.floor(count * 0.3), weakSet.length);
        const shuffledWeak = [...weakSet].sort(() => Math.random() - 0.5);
        for (let i = 0; i < weakCount; i++) {
            const wq = shuffledWeak[i];
            reviewQuestions.push({
                ...wq.data,
                id: `${wq.data.id}_review_${Date.now()}_${i}`,
                isReview: true  // Mark as review question
            });
        }
    }

    // 2. Generate New Questions (full count - not reduced by review)
    let newQuestions: Question[] = [];

    // Dispatch based on Pool Type
    const isSequential = stage.mode === 'SEQ';

    if (pool.type === 'ten_complement') {
        newQuestions = generateTenComplement(pool, count);
    } else if (pool.type === 'add_pairs') {
        newQuestions = generateAddPairs(pool, count);
    } else if (pool.type === 'add_three_numbers') {
        newQuestions = generateAddThreeNumbers(pool, count);
    } else if (pool.type === 'stair_addition') {
        newQuestions = generateStairAddition(pool, count);
    } else if (pool.type === 'add_2d_1d') {
        newQuestions = generateAdd2D1D(pool, count);
    } else if (pool.type === 'add_1d_2d') {
        newQuestions = generateAdd1D2D(pool, count);
    } else if (pool.type === 'add_carry_procedure') {
        newQuestions = generateAddCarryProcedure(pool, count, isSequential);
    } else if (pool.type === 'sub_pairs') {
        newQuestions = generateSubPairs(pool, count, isSequential);
    } else if (pool.type === 'sub_borrow_procedure') {
        newQuestions = generateSubBorrowProcedure(pool, count, isSequential);
    } else if (pool.type === 'sub_stair') {
        newQuestions = generateSubStair(pool, count);
    } else if (pool.type === 'sub_2d_1d') {
        newQuestions = generateSub2D1D(pool, count);
    } else if (pool.type === 'sub_add_mixed') {
        newQuestions = generateSubAddMixed(pool, count);
    } else if (pool.type === 'skip_count') {
        newQuestions = generateSkipCount(pool as SkipCountPool, count);
    } else if (pool.type === 'elev_add') {
        newQuestions = generateElevAdd(pool as ElevAddPool, count);
    } else if (pool.type === 'mul_link') {
        newQuestions = generateMulLink(pool as MulLinkPool, count);
    } else if (pool.type === 'mul_table') {
        newQuestions = generateMulTable(pool as MulTablePool, count, isSequential);
    } else if (pool.type === 'mul_review') {
        newQuestions = generateMulReview(pool as MulReviewPool, count);
    } else if (pool.type === 'mul_mix') {
        newQuestions = generateMulMix(pool as MulMixPool, count);
    } else if (pool.type === 'skip_tap') {
        newQuestions = generateSkipTap(pool as SkipTapPool, count);
        // Written Calculation (筆算)
    } else if (pool.type === 'place_value_2d') {
        newQuestions = generatePlaceValue2D(pool as PlaceValue2DPool, count);
    } else if (pool.type === 'place_value_3d') {
        newQuestions = generatePlaceValue3D(pool as PlaceValue3DPool, count);
    } else if (pool.type === 'written_form_fill') {
        newQuestions = generateWrittenFormFill(pool as WrittenFormFillPool, count);
    } else if (pool.type === 'written_form_choice') {
        newQuestions = generateWrittenFormChoice(pool as WrittenFormChoicePool, count);
    } else if (pool.type === 'written_add_2d2d') {
        newQuestions = generateWrittenAdd2D2D(pool as WrittenAdd2D2DPool, count);
    } else if (pool.type === 'carry_mark_tap') {
        newQuestions = generateCarryMarkTap(pool as CarryMarkTapPool, count);
    } else if (pool.type === 'written_verify') {
        newQuestions = generateWrittenVerify(pool as WrittenVerifyPool, count);
    } else if (pool.type === 'composite') {
        // Check if it's V2 (array-based weights) or V1 (object-based weights)
        if (Array.isArray((pool as any).weights)) {
            // CompositePoolV2: includes is PoolSpec[], weights is number[]
            const v2Pool = pool as CompositePoolV2;
            for (let i = 0; i < count; i++) {
                // Pick based on weights
                const totalWeight = v2Pool.weights.reduce((a, b) => a + b, 0);
                let random = Math.random() * totalWeight;
                let selectedIndex = 0;
                for (let j = 0; j < v2Pool.weights.length; j++) {
                    random -= v2Pool.weights[j];
                    if (random <= 0) {
                        selectedIndex = j;
                        break;
                    }
                }
                const subSpec = v2Pool.includes[selectedIndex];
                // Recursively generate from the sub-spec
                const subStage: Stage = {
                    ...stage,
                    poolSpec: subSpec,
                    round: { ...stage.round, questions: 1 }
                };
                const subResult = generateQuestionsForStage(subStage, []);
                if (subResult.newQuestions.length > 0) {
                    newQuestions.push(subResult.newQuestions[0]);
                }
            }
        } else {
            // Original CompositePool: string-based includes
            for (let i = 0; i < count; i++) {
                const key = pickWeighted(pool.weights as Record<string, number>);
                let subQ: Question[] = [];
                if (key === 'NUM10_MAKE') subQ = generateTenComplement({ type: 'ten_complement', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, 1);
                else if (key === 'ADD_1D_NO_CARRY') subQ = generateAddPairs({ type: 'add_pairs', aRange: [1, 9], bRange: [1, 9], constraints: { sumMax: 9 } }, 1);
                else if (key === 'ADD_1D_CARRY') subQ = generateAddPairs({ type: 'add_pairs', aRange: [1, 9], bRange: [1, 9], constraints: { sumMin: 10 } }, 1);
                else if (key === 'ADD_3NUM_MAKE10') subQ = generateAddThreeNumbers({ type: 'add_three_numbers', template: 'mixed', aRange: [1, 9], bRange: [1, 9], cRange: [1, 9] }, 1);
                else if (key === 'ADD_2D1D') subQ = generateAdd2D1D({ type: 'add_2d_1d', twoDigitRange: [11, 19], oneDigitRange: [1, 9], constraints: { sumMax: 28 } }, 1);

                if (subQ.length > 0) newQuestions.push(subQ[0]);
            }
        }
    } else if (pool.type === 'fixed_set' || pool.type === 'fixed_set_random') {
        const carryPairs: Question[] = [];
        for (let a = 1; a <= 9; a++) {
            for (let b = 1; b <= 9; b++) {
                if (a + b >= 10) {
                    carryPairs.push({ id: `fix_${a}_${b}`, text: `${a} + ${b}`, answer: (a + b).toString(), type: 'input' });
                }
            }
        }
        if (pool.type === 'fixed_set_random') {
            const shuffled = [...carryPairs].sort(() => Math.random() - 0.5);
            newQuestions = shuffled.slice(0, count);
        } else {
            newQuestions = carryPairs.slice(0, count);
        }
    }

    // Shuffle new questions if RND/MIX mode
    if (stage.mode === 'RND' || stage.mode === 'MIX') {
        newQuestions = newQuestions.sort(() => Math.random() - 0.5);
    }

    return {
        reviewQuestions,
        newQuestions
    };
}

