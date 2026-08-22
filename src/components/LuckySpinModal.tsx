import React, { useState, useRef } from 'react';
import { UserProfile } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { sound } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { X, Sparkles, Coins, Gem, Gift, Trophy } from 'lucide-react';

interface LuckySpinModalProps {
  user: UserProfile;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onRewardWon: (reward: { type: 'coins' | 'gems' | 'skin'; amount: number; label: string }) => void;
}

const SECTORS = [
  { label: '1,000 ذهب', labelEn: '1,000 Coins', type: 'coins', amount: 1000, color: '#f59e0b', text: '#000' },
  { label: '50 جوهرة', labelEn: '50 Gems', type: 'gems', amount: 50, color: '#06b6d4', text: '#fff' },
  { label: '5,000 ذهب', labelEn: '5,000 Coins', type: 'coins', amount: 5000, color: '#eab308', text: '#000' },
  { label: '100 جوهرة', labelEn: '100 Gems', type: 'gems', amount: 100, color: '#8b5cf6', text: '#fff' },
  { label: '2,500 ذهب', labelEn: '2,500 Coins', type: 'coins', amount: 2500, color: '#f97316', text: '#fff' },
  { label: '250 جوهرة', labelEn: '250 Gems', type: 'gems', amount: 250, color: '#10b981', text: '#000' },
  { label: '15,000 كنز', labelEn: '15K Jackpot', type: 'coins', amount: 15000, color: '#ef4444', text: '#fff' },
  { label: 'صندوق سري 🎁', labelEn: 'Mystery Box', type: 'skin', amount: 0, color: '#ec4899', text: '#fff' },
];

export const LuckySpinModal: React.FC<LuckySpinModalProps> = ({
  user,
  lang,
  isOpen,
  onClose,
  onRewardWon,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ label: string; amount: number; type: string } | null>(null);
  const t = translations[lang];

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    sound.playDiceRoll();

    // Random sector pick
    const selectedIndex = Math.floor(Math.random() * SECTORS.length);
    const sectorAngle = 360 / SECTORS.length;
    
    // Calculate final rotation (e.g. 5 full 360 spins + target angle)
    const extraSpins = 360 * 6;
    const targetOffset = 360 - (selectedIndex * sectorAngle + sectorAngle / 2);
    const finalRotation = rotation + extraSpins + (targetOffset - (rotation % 360));

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = SECTORS[selectedIndex];
      setWonPrize({
        label: lang === 'ar' ? prize.label : prize.labelEn,
        amount: prize.amount,
        type: prize.type,
      });

      sound.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onRewardWon({
        type: prize.type as any,
        amount: prize.amount,
        label: lang === 'ar' ? prize.label : prize.labelEn,
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-md p-6 flex flex-col items-center shadow-2xl relative text-white">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 end-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={24} className="text-purple-400 animate-spin" />
          <h2 className="text-xl font-black text-white">{t.luckySpin}</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 text-center">
          أدر العجلة الملكية واكسب آلاف الذهب والجواهر فورياً!
        </p>

        {/* Fortune Wheel Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
          
          {/* Wheel Pointer at Top */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"></div>

          {/* Spinning Wheel SVG */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-[0_0_30px_rgba(168,85,247,0.4)] overflow-hidden transition-all ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4000ms' : '0ms',
              transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.25, 1)',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {SECTORS.map((sector, i) => {
                const angle = 360 / SECTORS.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;

                // Arc coordinates
                const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);

                const textAngle = startAngle + angle / 2;
                const textRad = (Math.PI * (textAngle - 90)) / 180;
                const tx = 50 + 32 * Math.cos(textRad);
                const ty = 50 + 32 * Math.sin(textRad);

                return (
                  <g key={i}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={sector.color}
                      stroke="#1e1b4b"
                      strokeWidth="1"
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill={sector.text}
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                    >
                      {sector.type === 'coins' ? `🪙 ${sector.amount}` : sector.type === 'gems' ? `💎 ${sector.amount}` : '🎁'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Hub Badge */}
          <div className="absolute w-14 h-14 rounded-full bg-slate-900 border-4 border-amber-400 shadow-xl flex items-center justify-center z-20">
            <Trophy size={20} className="text-amber-400" />
          </div>
        </div>

        {/* Won Prize Banner */}
        {wonPrize && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3 text-center animate-in zoom-in-95 duration-200 w-full">
            <div className="text-xs text-emerald-300 font-bold">🎉 مبروك! لقد ربحت:</div>
            <div className="text-lg font-black text-white">{wonPrize.label}</div>
          </div>
        )}

        {/* Spin Trigger Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          id="spin-fortune-wheel-btn"
          className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:opacity-50 text-white font-black text-base transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
        >
          <Sparkles size={20} />
          <span>{isSpinning ? 'جارٍ التدوير...' : t.freeSpin}</span>
        </button>
      </div>
    </div>
  );
};
