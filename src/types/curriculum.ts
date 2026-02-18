export type PoolType =
  | 'ten_complement'
  | 'add_pairs'
  | 'add_three_numbers'
  | 'stair_addition'
  | 'add_2d_1d'
  | 'add_1d_2d'
  | 'composite'
  | 'add_carry_procedure'
  | 'fixed_set'
  | 'fixed_set_random'
  | 'sub_pairs'
  | 'sub_borrow_procedure'
  | 'sub_stair'
  | 'sub_2d_1d'
  | 'sub_add_mixed'
  // Multiplication (九九)
  | 'skip_count'
  | 'elev_add'
  | 'mul_link'
  | 'mul_table'
  | 'mul_review'
  | 'mul_mix'
  | 'skip_tap'
  // Written Calculation (筆算)
  | 'place_value_2d'
  | 'place_value_3d'
  | 'written_form_fill'
  | 'written_form_choice'
  | 'written_add_2d2d'
  | 'written_add'
  | 'carry_mark_tap'
  | 'mental_add_step'
  | 'written_verify';

export interface BasePoolSpec {
  type: PoolType;
  constraints?: {
    sumMax?: number;
    sumMin?: number;
    resultMax?: number; // For subtraction
    resultMin?: number; // For subtraction
    onesCarry?: boolean;
    onesNoCarry?: boolean;
    borrow?: boolean; // For subtraction
    noBorrow?: boolean; // For subtraction
    mustContainMake10Pair?: boolean;
    [key: string]: any;
  };
  normalization?: {
    commutative?: boolean;
  };
  avoid?: {
    noCarryPairs?: boolean;
    noBorrow?: boolean; // For subtraction
  };
}

export interface TenComplementPool extends BasePoolSpec {
  type: 'ten_complement';
  numbers: number[];
}

export interface AddPairsPool extends BasePoolSpec {
  type: 'add_pairs';
  aRange: [number, number];
  bRange: [number, number];
}

export interface AddThreeNumbersPool extends BasePoolSpec {
  type: 'add_three_numbers';
  template: 'make10_visible' | 'make10_find' | 'mixed';
  pairs?: number[][];
  thirdRange?: [number, number];
  aRange?: [number, number];
  bRange?: [number, number];
  cRange?: [number, number];
}

export interface StairAdditionPool extends BasePoolSpec {
  type: 'stair_addition';
  baseNumbers: number[];
  topRowLength: number;
}

export interface Add2D1DPool extends BasePoolSpec {
  type: 'add_2d_1d';
  twoDigitRange: [number, number];
  oneDigitRange: [number, number];
}

export interface Add1D2DPool extends BasePoolSpec {
  type: 'add_1d_2d';
  oneDigitRange: [number, number];
  twoDigitRange: [number, number];
}

export interface CompositePool extends BasePoolSpec {
  type: 'composite';
  includes: string[]; // references skillIds or poolTypes? Usually refers to other behavior, but for now simple strings
  weights: Record<string, number>;
}

export interface AddCarryProcedurePool extends BasePoolSpec {
  type: 'add_carry_procedure';
  variant?: 'split_only' | 'full';
  aRange: [number, number];
  bRange: [number, number];
}

export interface FixedSetPool extends BasePoolSpec {
  type: 'fixed_set' | 'fixed_set_random';
  setId: string;
  notes?: string;
}

export type PoolSpec =
  | TenComplementPool
  | AddPairsPool
  | AddThreeNumbersPool
  | StairAdditionPool
  | Add2D1DPool
  | Add1D2DPool
  | CompositePool
  | CompositePoolV2
  | AddCarryProcedurePool
  | FixedSetPool
  | SubPairsPool
  | SubBorrowProcedurePool
  | SubStairPool
  | Sub2D1DPool
  | SubAddMixedPool
  // Multiplication (九九)
  | SkipCountPool
  | ElevAddPool
  | MulLinkPool
  | MulTablePool
  | MulReviewPool
  | MulMixPool
  | SkipTapPool
  // Written Calculation (筆算)
  | PlaceValue2DPool
  | PlaceValue3DPool
  | WrittenFormFillPool
  | WrittenFormChoicePool
  | WrittenAdd2D2DPool
  | WrittenAddPool
  | CarryMarkTapPool
  | MentalAddStepPool
  | WrittenVerifyPool;

export interface SubPairsPool extends BasePoolSpec {
  type: 'sub_pairs';
  minuendRange: [number, number]; // 引かれる数
  subtrahendRange: [number, number]; // 引く数
}

export interface SubBorrowProcedurePool extends BasePoolSpec {
  type: 'sub_borrow_procedure';
  minuendRange: [number, number];
  subtrahendRange: [number, number];
  variant?: 'split_only' | 'full';
}

export interface SubStairPool extends BasePoolSpec {
  type: 'sub_stair';
  baseNumbers: number[];
  topRowLength: number;
}

export interface Sub2D1DPool extends BasePoolSpec {
  type: 'sub_2d_1d';
  twoDigitRange: [number, number];
  oneDigitRange: [number, number];
}

// 10 - a + b format (e.g., 10 - 8 + 1 = 3)
export interface SubAddMixedPool extends BasePoolSpec {
  type: 'sub_add_mixed';
  base: number; // Usually 10
  subtrahendRange: [number, number]; // a in 10 - a + b
  addendRange: [number, number]; // b in 10 - a + b
}

// ============================================
// Multiplication (九九) Pool Interfaces
// ============================================

// Composite Pool V2 - Array-based includes and weights (for multiplication curriculum)
export interface CompositePoolV2 extends BasePoolSpec {
  type: 'composite';
  includes: PoolSpec[];
  weights: number[];
}

// N飛びカウント (e.g., 0, 2, _, 6, 8, ...)
export interface SkipCountPool extends BasePoolSpec {
  type: 'skip_count';
  step: number;        // 飛ばす数（2, 3, ...）
  from: number;        // 開始値
  to: number;          // 終了値
  blanks: number;      // 空欄の数
}

// エレベーター足し算 (e.g., 0+2=?, 2+2=?, ...)
export interface ElevAddPool extends BasePoolSpec {
  type: 'elev_add';
  add: number;         // 足す数（+2, +3, ...）
  start: number;       // 開始値
  stepsRange: [number, number];  // ステップ範囲
  format: 'equation_or_next';    // 出題形式
}

// 足し算⇄掛け算リンク (e.g., 2+2+2 = 2×?)
export interface MulLinkPool extends BasePoolSpec {
  type: 'mul_link';
  n: number;           // 掛ける数
  range: [number, number];  // 範囲
  direction: 'both' | 'add_to_mul' | 'mul_to_add';
}

// 九九問題 (e.g., 2×3 = ?)
export interface MulTablePool extends BasePoolSpec {
  type: 'mul_table';
  n: number;           // 段（2, 3, ...）
  range: [number, number];  // 範囲 [1, 9]
  order?: 'asc' | 'random';
}

// 復習（複数段）
export interface MulReviewPool extends BasePoolSpec {
  type: 'mul_review';
  fromN: number;       // 開始段
  toN: number;         // 終了段
  range: [number, number];
  distribution?: {
    minPerN?: number;
    rest?: string;
  };
}

// 全段ミックス
export interface MulMixPool extends BasePoolSpec {
  type: 'mul_mix';
  fromN: number;
  toN: number;
  range: [number, number];
}

// Skip Tap Game (2とびタップ)
export interface SkipTapPool extends BasePoolSpec {
  type: 'skip_tap';
  step: number;
  from: number;
  to: number;
  totalNumbers?: number;
  timeLimit?: number;
}

export interface StageRoundConfig {
  questions: number;
  secPerQuestion: number;
  passOverride?: {
    accuracy?: number;
    consecutivePassesRequired?: number;
  };
}

export interface Stage {
  id: string;
  title: string;
  skillId: string;
  mode: 'SEQ' | 'RND' | 'MIX' | 'FILL' | 'SET' | 'GRID';
  poolSpec: PoolSpec;
  round: StageRoundConfig;
  nextStageId: string | null;
  onComplete?: {
    unlockTracks?: string[];
    message?: string;
  };
}

export interface WeakInjectionRule {
  enabled: boolean;
  injectRatio: number;
  minInjectedPerRound: number;
  maxInjectedPerRound: number;
  promoteToWeakMiniStageAfterSameMistakeCount: number;
}

export interface GlobalRules {
  pass: {
    accuracy: number;
    mustFinishWithinTime: boolean;
    consecutivePassesRequired: number;
  };
  round: {
    defaultQuestionsPerRound: number;
    maxSameItemStreak: number;
  };
  weakInjection: WeakInjectionRule;
  timing: {
    mode: string;
    ui: {
      showCountdown: boolean;
      showPaceBar: boolean;
    };
  };
}

export interface Curriculum {
  version: string;
  domain: string;
  track: string;
  title: string;
  globalRules: GlobalRules;
  stageGraph: {
    startStageId: string;
    stages: Stage[];
  };
}

// Runtime Types

export interface Question {
  id: string; // unique for key
  text: string; // "8 + 7"
  answer: string; // "15"
  type: string; // 'input', 'fill', etc.
  items?: string[]; // for 3 numbers: ["8", "2", "5"]
  metadata?: any;
  isReview?: boolean;
}

export interface QuestionResult {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

export interface StageProgress {
  stageId: string;
  consecutivePasses: number;
  bestTimeSec?: number;
  unlocked: boolean;
  cleared: boolean;
}

export interface UserProgress {
  currentTrackId: string;
  currentStageId: string;
  stageProgressMap: Record<string, StageProgress>;
  weakSet: WeakQuestion[];
  lastPlayedAt: number;
}

export interface WeakQuestion {
  questionId: string; // normalized ID like "8+7"
  mistakeCount: number;
  lastMistakeAt: number;
  solvedCount: number; // how many times solved correctly since mistake?
  data: Question; // store full data to recreate
}

// ============================================
// Written Calculation (筆算) Pool Interfaces
// ============================================

// エラータグ型
export type WrittenCalcErrorTag =
  | 'E01' // 位ズレ
  | 'E02' // 列間の計算順
  | 'E03' // 繰り上がり書き忘れ
  | 'E04' // 繰り上がり足し忘れ
  | 'E05' // 繰り上がり二重
  | 'E06' // 繰り下がりくずし忘れ
  | 'E07' // 繰り下がり戻し忘れ/二重
  | 'E08' // 単純計算ミス
  | 'E09'; // 検算未実施

// 位取りトレーニング（2桁）
export interface PlaceValue2DPool extends BasePoolSpec {
  type: 'place_value_2d';
  range: [number, number]; // 10〜99
}

// 位取りトレーニング（3桁）
export interface PlaceValue3DPool extends BasePoolSpec {
  type: 'place_value_3d';
  range: [number, number]; // 100〜999
  includeZeroMiddle?: boolean; // 例: 405 のような中間に0がある数
}

// 筆算フォーム穴埋め
export interface WrittenFormFillPool extends BasePoolSpec {
  type: 'written_form_fill';
  operandARange: [number, number];
  operandBRange: [number, number];
  format: 'place_lower' | 'drag_align'; // 下段に配置 or ドラッグで揃える
}

// 筆算フォーム選択
export interface WrittenFormChoicePool extends BasePoolSpec {
  type: 'written_form_choice';
  operandARange: [number, number];
  operandBRange: [number, number];
  errorTypes: ('right_shift' | 'left_shift' | 'blank_shift')[]; // ズレの種類
}

// 2けた+2けた筆算
export interface WrittenAdd2D2DPool extends BasePoolSpec {
  type: 'written_add_2d2d';
  aRange: [number, number];
  bRange: [number, number];
  carryRequired?: boolean; // 繰り上がり必須
  noCarry?: boolean; // 繰り上がりなし
  inputOrder?: 'ones_first'; // 一の位から入力
}

export interface WrittenAddPool extends BasePoolSpec {
  type: 'written_add';
  aRange: [number, number];
  bRange: [number, number];
  carryRequired?: boolean;
  noCarry?: boolean;
  inputOrder?: 'ones_first';
}

// 繰り上がりマーク練習
export interface CarryMarkTapPool extends BasePoolSpec {
  type: 'carry_mark_tap';
  aRange: [number, number];
  bRange: [number, number];
  carryRatio?: number; // 繰り上がりありの割合（0〜1）
}

// 検算
export interface WrittenVerifyPool extends BasePoolSpec {
  type: 'written_verify';
  aRange: [number, number];
  bRange: [number, number];
  verifyType: 'subtract_a' | 'subtract_b' | 'random'; // 検算の引く対象
}

// 暗算ステップ（手順理解）
export interface MentalAddStepPool extends BasePoolSpec {
  type: 'mental_add_step';
  aRange: [number, number];
  bRange: [number, number];
  stepType?: 'tens_then_ones';
}
