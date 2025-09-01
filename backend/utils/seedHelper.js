// backend/utils/seedHelper.js
import seedrandom from "seedrandom";

/** 用所有玩家的骰子點數 rolls[] 產生 seed，公平選出 candidates 的其中一個 */
export function pickFinalChoice(rolls, candidates) {
  const seed = rolls.join("-");            // 也可改成 hash/加總
  const rng = seedrandom(seed);            // 決定性亂數
  const index = Math.floor(rng() * candidates.length);
  return { finalChoice: candidates[index], seed };
}
