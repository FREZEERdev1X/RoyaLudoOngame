import React, { useState } from 'react';
import { DICE_SKINS } from '../data/skins';
import { sound } from '../utils/soundEngine';
import { Dices } from 'lucide-react';

interface DiceRollerProps {
  diceValue: number | null;
  hasRolled: boolean;
  isMyTurn: boolean;
  diceSkinId: string;
  onRoll: () => void;
  disabled?: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  diceValue,
  hasRolled,
  isMyTurn,
  diceSkinId,
  onRoll,
  disabled = false,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const skin = DICE_SKINS.find((s) => s.id === diceSkinId) || DICE_SKINS[0];

  const handleRoll = () => {
    if (!isMyTurn || hasRolled || isRolling || disabled) return;
    setIsRolling(true);
    sound.playDiceRoll();

    setTimeout(() => {
      setIsRolling(false);
      onRoll();
    }, 600);
  };

  const renderDots = (value: number) => {
    const dotColor = skin.dotColor;
    
    // Dot layouts for 1 to 6 (compact and proportional)
    switch (value) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-1.5">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full self-start shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full self-end shadow-inner" style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full self-start shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full self-center shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full self-end shadow-inner" style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 p-1.5 gap-1 place-items-center">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full relative p-1.5">
            <div className="absolute top-1 left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 p-1 gap-0.5 place-items-center">
            <div className="w-1.5 h-1.5 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
            <div className="w-1.5 h-1.5 rounded-full shadow-inner" style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <Dices size={18} className="opacity-50 text-slate-700" />
          </div>
        );
    }
  };

  const isClickable = isMyTurn && !hasRolled && !disabled;

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={handleRoll}
        disabled={!isClickable}
        id="game-dice-button"
        className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl p-0.5 transition-all duration-200 transform select-none ${
          isClickable
            ? 'cursor-pointer hover:scale-110 active:scale-95 ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
            : 'opacity-90 cursor-default'
        } ${isRolling ? 'animate-spin' : ''}`}
      >
        {/* Compact Dice Body with Gradient */}
        <div
          className={`w-full h-full rounded-lg bg-gradient-to-br ${skin.bgGradient} border border-white/40 shadow-md flex items-center justify-center overflow-hidden transition-transform`}
          style={{
            boxShadow: `0 3px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.6), 0 0 8px ${skin.glowColor}`,
          }}
        >
          {renderDots(diceValue || 6)}
        </div>

        {/* Small Roll Indicator Prompt */}
        {isClickable && (
          <div className="absolute -top-2.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full shadow whitespace-nowrap animate-pulse border border-amber-300">
            ارمِ 🎲
          </div>
        )}
      </button>
    </div>
  );
};
