import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { Language, translations } from '../i18n/translations';
import { PAWN_SKINS, DICE_SKINS, BOARD_SKINS, isSpecialVipUser } from '../data/skins';
import { sound } from '../utils/soundEngine';
import { 
  X, 
  ShoppingBag, 
  Crown, 
  Coins, 
  Gem, 
  Check, 
  Sparkles, 
  Zap, 
  Shield, 
  Flame, 
  Dices 
} from 'lucide-react';

interface StoreModalProps {
  user: UserProfile;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onEquipPawnSkin: (skinId: string) => void;
  onEquipDiceSkin: (skinId: string) => void;
  onEquipBoardSkin: (skinId: string) => void;
  onBuyPawnSkin: (skinId: string, costCoins: number, costGems: number) => void;
  onBuyDiceSkin: (skinId: string, costCoins: number, costGems: number) => void;
  onBuyBoardSkin: (skinId: string, costCoins: number, costGems: number) => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  user,
  lang,
  isOpen,
  onClose,
  onEquipPawnSkin,
  onEquipDiceSkin,
  onEquipBoardSkin,
  onBuyPawnSkin,
  onBuyDiceSkin,
  onBuyBoardSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'pawns' | 'dice' | 'boards'>('pawns');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const t = translations[lang];

  const isVip = isSpecialVipUser(user.email) || user.isVipMaster;

  if (!isOpen) return null;

  const handleBuyOrEquipPawn = (skin: typeof PAWN_SKINS[0]) => {
    setPurchaseError(null);
    const isUnlocked = isVip || user.unlockedPawnSkins.includes(skin.id) || skin.priceCoins === 0;

    if (isUnlocked) {
      sound.playClick();
      onEquipPawnSkin(skin.id);
    } else {
      if (user.coins < skin.priceCoins && user.gems < skin.priceGems) {
        setPurchaseError(t.notEnoughCoins);
        return;
      }
      sound.playCoins();
      onBuyPawnSkin(skin.id, skin.priceCoins, skin.priceGems);
    }
  };

  const handleBuyOrEquipDice = (skin: typeof DICE_SKINS[0]) => {
    setPurchaseError(null);
    const isUnlocked = isVip || user.unlockedDiceSkins.includes(skin.id) || skin.priceCoins === 0;

    if (isUnlocked) {
      sound.playClick();
      onEquipDiceSkin(skin.id);
    } else {
      if (user.coins < skin.priceCoins && user.gems < skin.priceGems) {
        setPurchaseError(t.notEnoughCoins);
        return;
      }
      sound.playCoins();
      onBuyDiceSkin(skin.id, skin.priceCoins, skin.priceGems);
    }
  };

  const handleBuyOrEquipBoard = (skin: typeof BOARD_SKINS[0]) => {
    setPurchaseError(null);
    const isUnlocked = isVip || user.unlockedBoardSkins.includes(skin.id) || skin.priceCoins === 0;

    if (isUnlocked) {
      sound.playClick();
      onEquipBoardSkin(skin.id);
    } else {
      if (user.coins < skin.priceCoins && user.gems < skin.priceGems) {
        setPurchaseError(t.notEnoughCoins);
        return;
      }
      sound.playCoins();
      onBuyBoardSkin(skin.id, skin.priceCoins, skin.priceGems);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg">
              <ShoppingBag size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{t.store}</span>
                {isVip && (
                  <span className="bg-amber-400 text-slate-950 text-xs px-2 py-0.5 rounded-full font-bold">
                    VIP 100% UNLOCKED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                خصص قطعك، نردك، ورقعتك بأفخم السكنات الأسطورية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Balances in Header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-amber-300">
                <Coins size={13} />
                <span>{user.coins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-300">
                <Gem size={13} />
                <span>{user.gems.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Special VIP Banner for hamodydeab3@gmail.com */}
        {isVip && (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-amber-300 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-amber-400 animate-bounce" />
              <span>👑 {t.vipMasterAccount}: جميع السكنات والنرود والرقع مفتوحة ومجانية لحساب {user.email}!</span>
            </div>
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">
              FREE PASS
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('pawns');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pawns'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crown size={16} />
            <span>{t.pawnSkins}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dice');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'dice'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Dices size={16} />
            <span>{t.diceSkins}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('boards');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'boards'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles size={16} />
            <span>{t.boardThemes}</span>
          </button>
        </div>

        {/* Error Alert */}
        {purchaseError && (
          <div className="bg-red-500/20 border-b border-red-500/30 text-red-300 text-xs py-2 px-4 text-center font-bold">
            ⚠️ {purchaseError}
          </div>
        )}

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* PAWNS TAB */}
          {activeTab === 'pawns' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {PAWN_SKINS.map((skin) => {
                const isEquipped = user.selectedPawnSkin === skin.id;
                const isUnlocked = isVip || user.unlockedPawnSkins.includes(skin.id) || skin.priceCoins === 0;

                return (
                  <div
                    key={skin.id}
                    className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      {/* Rarity & Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            skin.rarity === 'mythic'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : skin.rarity === 'legendary'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : skin.rarity === 'epic'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {skin.rarity}
                        </span>

                        {isEquipped && (
                          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={10} className="stroke-[3]" />
                            <span>{t.equipped}</span>
                          </span>
                        )}
                      </div>

                      {/* 4 Color Token Preview */}
                      <div className="bg-slate-950/70 rounded-xl p-3 mb-3 flex items-center justify-around border border-slate-800">
                        {(['red', 'green', 'yellow', 'blue'] as const).map((col) => (
                          <div key={col} className="relative flex flex-col items-center">
                            <div
                              className="w-8 h-8 rounded-full shadow-lg border-2 flex items-center justify-center font-bold text-white text-xs"
                              style={{
                                backgroundColor: skin.colorPalette[col],
                                borderColor: skin.colorPalette.border,
                                boxShadow: `0 0 10px ${skin.colorPalette.glow}`,
                              }}
                            >
                              👑
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1 capitalize">{col}</span>
                          </div>
                        ))}
                      </div>

                      <h3 className="font-bold text-sm text-white mb-1">
                        {skin.name[lang] || skin.name.ar}
                      </h3>
                      <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                        {skin.description[lang === 'ar' ? 'ar' : 'en'] || skin.description.ar}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-slate-700 text-slate-400 text-xs font-bold cursor-default"
                        >
                          {t.equipped}
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleBuyOrEquipPawn(skin)}
                          className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Check size={14} className="stroke-[3]" />
                          <span>{t.equip}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyOrEquipPawn(skin)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                        >
                          <span>{t.buy}</span>
                          <span className="flex items-center gap-0.5">
                            <Coins size={13} />
                            {skin.priceCoins.toLocaleString()}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DICE TAB */}
          {activeTab === 'dice' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {DICE_SKINS.map((skin) => {
                const isEquipped = user.selectedDiceSkin === skin.id;
                const isUnlocked = isVip || user.unlockedDiceSkins.includes(skin.id) || skin.priceCoins === 0;

                return (
                  <div
                    key={skin.id}
                    className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {skin.rarity}
                        </span>
                        {isEquipped && (
                          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={10} className="stroke-[3]" />
                            <span>{t.equipped}</span>
                          </span>
                        )}
                      </div>

                      {/* Dice Visual Preview */}
                      <div className="bg-slate-950/70 rounded-xl p-4 mb-3 flex items-center justify-center border border-slate-800">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${skin.bgGradient} border-2 border-white/40 shadow-xl flex items-center justify-center relative p-1.5`}
                          style={{
                            boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 15px ${skin.glowColor}`,
                          }}
                        >
                          {/* Render 5 dots */}
                          <div className="w-full h-full relative">
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.dotColor }}></div>
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.dotColor }}></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.dotColor }}></div>
                            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.dotColor }}></div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.dotColor }}></div>
                          </div>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-white mb-2">
                        {skin.name[lang] || skin.name.ar}
                      </h3>
                    </div>

                    <div>
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-slate-700 text-slate-400 text-xs font-bold cursor-default"
                        >
                          {t.equipped}
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleBuyOrEquipDice(skin)}
                          className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Check size={14} className="stroke-[3]" />
                          <span>{t.equip}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyOrEquipDice(skin)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                        >
                          <span>{t.buy}</span>
                          <span className="flex items-center gap-0.5">
                            <Coins size={13} />
                            {skin.priceCoins.toLocaleString()}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOARDS TAB */}
          {activeTab === 'boards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {BOARD_SKINS.map((skin) => {
                const isEquipped = user.selectedBoardSkin === skin.id;
                const isUnlocked = isVip || user.unlockedBoardSkins.includes(skin.id) || skin.priceCoins === 0;

                return (
                  <div
                    key={skin.id}
                    className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {skin.rarity}
                        </span>
                        {isEquipped && (
                          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={10} className="stroke-[3]" />
                            <span>{t.equipped}</span>
                          </span>
                        )}
                      </div>

                      {/* Board Mini Preview */}
                      <div 
                        className="rounded-xl p-3 mb-3 h-28 border border-slate-700 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: skin.boardBg }}
                      >
                        <div className="grid grid-cols-3 gap-1 w-20 h-20">
                          <div className="bg-emerald-500 rounded"></div>
                          <div className="bg-slate-400/30 rounded"></div>
                          <div className="bg-amber-500 rounded"></div>
                          <div className="bg-slate-400/30 rounded"></div>
                          <div className="bg-amber-400/50 rounded flex items-center justify-center text-xs">👑</div>
                          <div className="bg-slate-400/30 rounded"></div>
                          <div className="bg-red-500 rounded"></div>
                          <div className="bg-slate-400/30 rounded"></div>
                          <div className="bg-blue-500 rounded"></div>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-white mb-2">
                        {skin.name[lang] || skin.name.ar}
                      </h3>
                    </div>

                    <div>
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-slate-700 text-slate-400 text-xs font-bold cursor-default"
                        >
                          {t.equipped}
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleBuyOrEquipBoard(skin)}
                          className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Check size={14} className="stroke-[3]" />
                          <span>{t.equip}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyOrEquipBoard(skin)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                        >
                          <span>{t.buy}</span>
                          <span className="flex items-center gap-0.5">
                            <Coins size={13} />
                            {skin.priceCoins.toLocaleString()}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
