import { PlayerColor } from '../types/game';

// 15x15 Grid representation
export interface Coordinate {
  row: number;
  col: number;
}

// 52 common path tiles in clockwise order starting from Red's start tile
export const MAIN_PATH_COORDINATES: Coordinate[] = [
  // 0 to 4: Going up along bottom-left vertical corridor
  { row: 13, col: 6 }, // 0: Red Start (SAFE ⭐)
  { row: 12, col: 6 }, // 1
  { row: 11, col: 6 }, // 2
  { row: 10, col: 6 }, // 3
  { row: 9, col: 6 },  // 4
  // 5 to 10: Turning left along middle-left horizontal corridor
  { row: 8, col: 5 },  // 5
  { row: 8, col: 4 },  // 6
  { row: 8, col: 3 },  // 7
  { row: 8, col: 2 },  // 8: Safe Star ⭐
  { row: 8, col: 1 },  // 9
  { row: 8, col: 0 },  // 10
  // 11 to 12: Around left end
  { row: 7, col: 0 },  // 11
  { row: 6, col: 0 },  // 12
  // 13 to 17: Turning right along upper-left horizontal corridor
  { row: 6, col: 1 },  // 13: Green Start (SAFE ⭐)
  { row: 6, col: 2 },  // 14
  { row: 6, col: 3 },  // 15
  { row: 6, col: 4 },  // 16
  { row: 6, col: 5 },  // 17
  // 18 to 23: Turning up along top-left vertical corridor
  { row: 5, col: 6 },  // 18
  { row: 4, col: 6 },  // 19
  { row: 3, col: 6 },  // 20
  { row: 2, col: 6 },  // 21: Safe Star ⭐
  { row: 1, col: 6 },  // 22
  { row: 0, col: 6 },  // 23
  // 24 to 25: Around top end
  { row: 0, col: 7 },  // 24
  { row: 0, col: 8 },  // 25
  // 26 to 30: Turning down along top-right vertical corridor
  { row: 1, col: 8 },  // 26: Yellow Start (SAFE ⭐)
  { row: 2, col: 8 },  // 27
  { row: 3, col: 8 },  // 28
  { row: 4, col: 8 },  // 29
  { row: 5, col: 8 },  // 30
  // 31 to 36: Turning right along upper-right horizontal corridor
  { row: 6, col: 9 },  // 31
  { row: 6, col: 10 }, // 32
  { row: 6, col: 11 }, // 33
  { row: 6, col: 12 }, // 34: Safe Star ⭐
  { row: 6, col: 13 }, // 35
  { row: 6, col: 14 }, // 36
  // 37 to 38: Around right end
  { row: 7, col: 14 }, // 37
  { row: 8, col: 14 }, // 38
  // 39 to 43: Turning left along lower-right horizontal corridor
  { row: 8, col: 13 }, // 39: Blue Start (SAFE ⭐)
  { row: 8, col: 12 }, // 40
  { row: 8, col: 11 }, // 41
  { row: 8, col: 10 }, // 42
  { row: 8, col: 9 },  // 43
  // 44 to 49: Turning down along bottom-right vertical corridor
  { row: 9, col: 8 },  // 44
  { row: 10, col: 8 }, // 45
  { row: 11, col: 8 }, // 46
  { row: 12, col: 8 }, // 47: Safe Star ⭐
  { row: 13, col: 8 }, // 48
  { row: 14, col: 8 }, // 49
  // 50 to 51: Around bottom end
  { row: 14, col: 7 }, // 50
  { row: 14, col: 6 }, // 51
];

// Home corridors (5 steps each)
export const HOME_CORRIDORS: Record<PlayerColor, Coordinate[]> = {
  red: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
  green: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  yellow: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  blue: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
};

// Goal centers (row 7, col 7)
export const GOAL_COORDINATES: Record<PlayerColor, Coordinate> = {
  red: { row: 8, col: 7 },
  green: { row: 7, col: 6 },
  yellow: { row: 6, col: 7 },
  blue: { row: 7, col: 8 },
};

// Base spots (4 tokens per home base)
export const BASE_COORDINATES: Record<PlayerColor, Coordinate[]> = {
  red: [
    { row: 10.5, col: 1.5 },
    { row: 10.5, col: 3.5 },
    { row: 12.5, col: 1.5 },
    { row: 12.5, col: 3.5 },
  ],
  green: [
    { row: 1.5, col: 1.5 },
    { row: 1.5, col: 3.5 },
    { row: 3.5, col: 1.5 },
    { row: 3.5, col: 3.5 },
  ],
  yellow: [
    { row: 1.5, col: 10.5 },
    { row: 1.5, col: 12.5 },
    { row: 3.5, col: 10.5 },
    { row: 3.5, col: 12.5 },
  ],
  blue: [
    { row: 10.5, col: 10.5 },
    { row: 10.5, col: 12.5 },
    { row: 12.5, col: 10.5 },
    { row: 12.5, col: 12.5 },
  ],
};

// Start indices on MAIN_PATH for each color
export const COLOR_START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Safe tile indices on MAIN_PATH
export const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export function isSafeTile(pathIndex: number): boolean {
  return SAFE_INDICES.includes(pathIndex);
}

// Check if a pawn can move with the rolled dice value
// Position encoding:
// -1: In Base
// 0..51: On Main Track
// 100..104: In Home Corridor (index - 100 is step 0..4)
// 200: Reached Home Goal!
export function canPawnMove(color: PlayerColor, currentPos: number, diceValue: number): boolean {
  if (currentPos === 200) {
    return false; // Already finished
  }

  // If in base, requires a 6 to enter
  if (currentPos === -1) {
    return diceValue === 6;
  }

  // Total steps traveled from start tile:
  const startIdx = COLOR_START_INDEX[color];

  if (currentPos >= 0 && currentPos <= 51) {
    let stepsSoFar = (currentPos - startIdx + 52) % 52;
    // Main track has 50 steps before turning into home corridor (at step 51, next is home corridor)
    // 51 is the tile right before entering home corridor.
    if (stepsSoFar + diceValue <= 50) {
      return true; // Still on main track
    } else if (stepsSoFar + diceValue <= 56) {
      return true; // Can enter home corridor or hit goal (56 is goal)
    } else {
      return false; // Overshoot!
    }
  }

  if (currentPos >= 100 && currentPos <= 104) {
    const homeStep = currentPos - 100; // 0..4
    const stepsSoFar = 51 + homeStep;
    return stepsSoFar + diceValue <= 56;
  }

  return false;
}

// Calculate step-by-step path array for smooth hopping animation
export function getPathSequence(color: PlayerColor, currentPos: number, diceValue: number): number[] {
  if (currentPos === -1 && diceValue === 6) {
    return [COLOR_START_INDEX[color]];
  }

  const sequence: number[] = [];
  let tempPos = currentPos;

  for (let step = 1; step <= diceValue; step++) {
    const nextPos = calculateNewPosition(color, tempPos, 1);
    sequence.push(nextPos);
    tempPos = nextPos;
  }

  return sequence;
}

// Calculate the new position after moving with diceValue
export function calculateNewPosition(color: PlayerColor, currentPos: number, diceValue: number): number {
  if (currentPos === -1 && diceValue === 6) {
    return COLOR_START_INDEX[color];
  }

  const startIdx = COLOR_START_INDEX[color];

  if (currentPos >= 0 && currentPos <= 51) {
    const stepsSoFar = (currentPos - startIdx + 52) % 52;
    const newSteps = stepsSoFar + diceValue;

    if (newSteps <= 50) {
      return (startIdx + newSteps) % 52;
    } else if (newSteps < 56) {
      const homeStep = newSteps - 51; // 0..4
      return 100 + homeStep;
    } else if (newSteps === 56) {
      return 200; // Goal reached!
    }
  }

  if (currentPos >= 100 && currentPos <= 104) {
    const homeStep = currentPos - 100;
    const stepsSoFar = 51 + homeStep;
    const newSteps = stepsSoFar + diceValue;

    if (newSteps < 56) {
      return 100 + (newSteps - 51);
    } else if (newSteps === 56) {
      return 200; // Goal reached!
    }
  }

  return currentPos;
}

// Get the visual (row, col) coordinate for any pawn position
export function getPawnCoordinate(color: PlayerColor, pawnIndex: number, position: number): Coordinate {
  if (position === -1) {
    return BASE_COORDINATES[color][pawnIndex] || { row: 0, col: 0 };
  }
  if (position >= 0 && position <= 51) {
    return MAIN_PATH_COORDINATES[position];
  }
  if (position >= 100 && position <= 104) {
    const idx = position - 100;
    return HOME_CORRIDORS[color][idx];
  }
  if (position === 200) {
    return GOAL_COORDINATES[color];
  }
  return { row: 0, col: 0 };
}

// Calculate progress steps from start tile (0 to 56)
export function getPawnProgressSteps(color: PlayerColor, pos: number): number {
  if (pos === -1) return -1;
  if (pos === 200) return 56;
  if (pos >= 100 && pos <= 104) return 51 + (pos - 100);
  const startIdx = COLOR_START_INDEX[color];
  return (pos - startIdx + 52) % 52;
}

// Check if a tile on main track has enemies nearby that could capture it (within 1..6 tiles behind)
export function isTileUnderThreat(
  tileIndex: number,
  myColor: PlayerColor,
  allPlayersPawns: Record<PlayerColor, number[]>
): boolean {
  if (tileIndex < 0 || tileIndex > 51 || isSafeTile(tileIndex)) {
    return false;
  }

  for (const [oppColor, oppPawns] of Object.entries(allPlayersPawns)) {
    if (oppColor === myColor) continue;
    for (const ePos of oppPawns) {
      if (ePos >= 0 && ePos <= 51) {
        const distance = (tileIndex - ePos + 52) % 52;
        if (distance >= 1 && distance <= 6) {
          return true; // Enemy can reach this tile in next roll
        }
      }
    }
  }
  return false;
}

// Smart AI Bot Move Chooser with Multi-Tier Tactical Intelligence
export function chooseBotMove(
  color: PlayerColor,
  pawns: number[],
  diceValue: number,
  allPlayersPawns: Record<PlayerColor, number[]>,
  difficulty: 'easy' | 'medium' | 'hard' = 'hard'
): number {
  const validPawnIndices: number[] = [];

  pawns.forEach((pos, idx) => {
    if (canPawnMove(color, pos, diceValue)) {
      validPawnIndices.push(idx);
    }
  });

  if (validPawnIndices.length === 0) return -1;
  if (validPawnIndices.length === 1) return validPawnIndices[0];

  if (difficulty === 'easy') {
    // Random valid move
    return validPawnIndices[Math.floor(Math.random() * validPawnIndices.length)];
  }

  // Active pawns currently on board
  const activePawnsCount = pawns.filter((p) => p >= 0 && p !== 200).length;

  // Medium & Hard Deep Heuristic Evaluation
  let bestIdx = validPawnIndices[0];
  let highestScore = -Infinity;

  validPawnIndices.forEach((pIdx) => {
    const currentPos = pawns[pIdx];
    const nextPos = calculateNewPosition(color, currentPos, diceValue);
    let score = 0;

    const currentSteps = getPawnProgressSteps(color, currentPos);
    const nextSteps = getPawnProgressSteps(color, nextPos);

    // 1. Goal reaching is absolute highest priority (+3000)
    if (nextPos === 200) {
      score += 3000;
    }

    // 2. Capturing an opponent pawn (+1800 + bonus for capturing advanced pawns)
    if (nextPos >= 0 && nextPos <= 51 && !isSafeTile(nextPos)) {
      let capturedPawnValue = 0;
      let didCapture = false;

      Object.entries(allPlayersPawns).forEach(([oppColor, oppPositions]) => {
        if (oppColor !== color) {
          oppPositions.forEach((oPos) => {
            if (oPos === nextPos) {
              didCapture = true;
              const oppSteps = getPawnProgressSteps(oppColor as PlayerColor, oPos);
              capturedPawnValue = Math.max(capturedPawnValue, oppSteps);
            }
          });
        }
      });

      if (didCapture) {
        score += 1800 + (capturedPawnValue * 20); // Massive reward for wiping out leading opponent
      }
    }

    // 3. Escaping imminent danger (+1200)
    if (currentPos >= 0 && currentPos <= 51 && isTileUnderThreat(currentPos, color, allPlayersPawns)) {
      // If moving saves the pawn from threat
      const isNextSafe = nextPos === 200 || nextPos >= 100 || isSafeTile(nextPos) || !isTileUnderThreat(nextPos, color, allPlayersPawns);
      if (isNextSafe) {
        score += 1200 + (currentSteps * 10);
      }
    }

    // 4. Entering safe home corridor (+1000)
    if (nextPos >= 100 && currentPos < 100) {
      score += 1000;
    }

    // 5. Landing on a Safe Star tile (+600)
    if (nextPos >= 0 && nextPos <= 51 && isSafeTile(nextPos)) {
      score += 600;
    }

    // 6. Unlocking pawn from base on 6
    if (currentPos === -1 && nextPos !== -1) {
      if (activePawnsCount === 0) {
        score += 1500; // Must get out if no pawns on field
      } else if (activePawnsCount < 3) {
        score += 850;
      } else {
        score += 450;
      }
    }

    // 7. Danger Penalty: Moving into a tile where enemy is 1..6 tiles behind (-800)
    if (nextPos >= 0 && nextPos <= 51 && !isSafeTile(nextPos) && isTileUnderThreat(nextPos, color, allPlayersPawns)) {
      score -= 750;
    }

    // 8. General forward progression (advance closest to goal)
    score += nextSteps * 15;

    // Small jitter for unpredictability in medium mode
    if (difficulty === 'medium') {
      score += Math.random() * 80;
    }

    if (score > highestScore) {
      highestScore = score;
      bestIdx = pIdx;
    }
  });

  return bestIdx;
}
