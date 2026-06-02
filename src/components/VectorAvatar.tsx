import React from 'react';

interface VectorAvatarProps {
  type: string; // 'slime' | 'robot' | 'ninja' | 'kitten' | 'wizard' | 'ghost' | or any avatar ID
  facing: 'left' | 'right';
  isJumping: boolean;
  isSpeaking: boolean;
  scale?: number;
  primaryColor?: string; // custom color optionalizer
}

export default function VectorAvatar({
  type,
  facing,
  isJumping,
  isSpeaking,
  scale = 1.0,
  primaryColor
}: VectorAvatarProps) {
  // Normalize the type string
  const cleanType = type.toLowerCase();
  
  // Decide what theme color to use if not provided
  const getThemeColor = () => {
    if (primaryColor) return primaryColor;
    if (cleanType.includes('slime')) return '#ec4899'; // pink
    if (cleanType.includes('robot')) return '#06b6d4'; // cyan
    if (cleanType.includes('ninja')) return '#3b82f6'; // blue
    if (cleanType.includes('kitten')) return '#f97316'; // orange
    if (cleanType.includes('wizard')) return '#8b5cf6'; // purple
    if (cleanType.includes('ghost')) return '#a1a1aa'; // zinc
    return '#ec4899'; // fallback pink
  };

  const themeHex = getThemeColor();

  // Helper matching to select which vector body to draw
  const isSlime = cleanType.includes('slime') || cleanType === 'av_c15' || cleanType.includes('15') || cleanType.includes('jelly');
  const isRobot = cleanType.includes('robot') || cleanType === 'av_c34' || cleanType.includes('34');
  const isNinja = cleanType.includes('ninja') || cleanType === 'av_c37' || cleanType.includes('av_c1') || cleanType.includes('37') || cleanType.includes('1');
  const isKitten = cleanType.includes('kitten') || cleanType === 'av_c29' || cleanType.includes('av_c2') || cleanType.includes('29') || cleanType.includes('2');
  const isWizard = cleanType.includes('wizard') || cleanType === 'av_c21' || cleanType.includes('21');
  const isGhost = cleanType.includes('ghost') || cleanType === 'av_c14' || cleanType.includes('14');

  // Fallback to Slime if none matches
  const matchType = isSlime ? 'slime' : isRobot ? 'robot' : isNinja ? 'ninja' : isKitten ? 'kitten' : isWizard ? 'wizard' : isGhost ? 'ghost' : 'slime';

  return (
    <div 
      className="relative flex items-center justify-center overflow-visible select-none pointer-events-none"
      style={{
        width: `${55 * scale}px`,
        height: `${55 * scale}px`,
        transform: `scaleX(${facing === 'left' ? -1 : 1})`,
        transition: 'transform 0.25s ease'
      }}
    >
      {/* 1. SLIME VECTOR CHARACTER BODY */}
      {matchType === 'slime' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          {/* Slime gel shadow */}
          <div className="absolute bottom-0 w-11 h-2 bg-black/35 rounded-full filter blur-[1px]" />
          
          {/* Main Slime body */}
          <div 
            className={`w-11 h-10 relative rounded-t-[22px] rounded-b-[14px] flex flex-col items-center justify-center transition-all ${
              isJumping ? 'animate-none' : 'animate-[slimeGlow_2.2s_infinite_ease-in-out]'
            }`}
            style={{ 
              backgroundColor: themeHex, 
              border: `2.5px solid #000000`,
              boxShadow: `inset -3px -4px 0px rgba(0, 0, 0, 0.15), 0 0 12px ${themeHex}60`
            }}
          >
            {/* Cute Crown perched top */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-4 text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-bounce">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="#000" strokeWidth="2.5">
                <path d="M5 21h14v-2H5v2zm0-4h14l-2.5-6L12 16l-4.5-5L5 17z" />
              </svg>
            </div>

            {/* Glowing Anime Face */}
            <div className={`flex flex-col items-center justify-center gap-0.5 mt-2 transition-transform duration-200 ${isSpeaking ? 'scale-110' : ''}`}>
              {/* Eyes with Blinking */}
              <div className="flex gap-2.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full relative animate-[blink_4s_infinite] border border-black/50">
                  <div className="absolute top-0.5 left-0.5 w-[3px] h-[3px] bg-black rounded-full" />
                </div>
                <div className="w-1.5 h-1.5 bg-white rounded-full relative animate-[blink_4s_infinite] border border-black/50">
                  <div className="absolute top-0.5 left-0.5 w-[3px] h-[3px] bg-black rounded-full" />
                </div>
              </div>
              
              {/* Blushing cheeks */}
              <div className="flex justify-between w-7 -mt-1.5 px-0.5">
                <div className="w-1.5 h-[3px] bg-pink-300 rounded-full opacity-80" />
                <div className="w-1.5 h-[3px] bg-pink-300 rounded-full opacity-80" />
              </div>

              {/* Mouth with speech action */}
              <div 
                className={`border border-black rounded-full transition-all duration-150 ${
                  isSpeaking ? 'w-2 h-2.5 bg-red-400' : 'w-1.5 h-0.5 bg-black'
                }`} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. CYBER ROBOT VECTOR CHARACTER BODY */}
      {matchType === 'robot' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          {/* Hover Jet Shadow */}
          <div className="absolute bottom-0 w-8 h-1.5 bg-cyan-500/20 rounded-full filter blur-[2px] animate-pulse" />
          
          {/* Robo screen body */}
          <div 
            className="w-10 h-11 relative rounded-lg flex flex-col items-center justify-between p-1 bg-zinc-800 border-2 border-black"
            style={{ 
              boxShadow: `inset -2px -2px 0px rgba(0,0,0,0.4), 0 0 10px ${themeHex}40`
            }}
          >
            {/* Spinning/pulsing head antenna */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping border border-black" />
              <div className="w-[3px] h-2 bg-zinc-650 border-r border-black" />
            </div>

            {/* Glowing Face Matrix Screen */}
            <div className="w-full flex-grow bg-zinc-950 rounded border border-zinc-700/50 flex flex-col items-center justify-center gap-1 p-0.5 mt-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
              
              {/* LED Scanning grid eyes */}
              <div className="flex gap-2.5 z-10">
                <div className="w-2 h-1 bg-cyan-400 rounded-sm relative animate-[blink_3.5s_infinite]" />
                <div className="w-2 h-1 bg-cyan-400 rounded-sm relative animate-[blink_3.5s_infinite]" />
              </div>

              {/* LED audio visualizer pattern when speaking */}
              <div className="flex gap-0.5 items-center justify-center h-2 overflow-hidden w-6">
                <span className={`w-[2px] rounded-sm bg-cyan-400 transition-all ${isSpeaking ? 'h-2 animate-bounce' : 'h-0.5'}`} style={{ animationDelay: '0.1s' }} />
                <span className={`w-[2px] rounded-sm bg-cyan-400 transition-all ${isSpeaking ? 'h-3 animate-bounce' : 'h-1'}`} />
                <span className={`w-[2px] rounded-sm bg-cyan-400 transition-all ${isSpeaking ? 'h-2 animate-bounce' : 'h-0.5'}`} style={{ animationDelay: '0.2s' }} />
              </div>
            </div>

            {/* Hover Engine nozzle */}
            <div className="w-5 h-1 bg-zinc-600 rounded-b border-x border-b border-black flex items-center justify-center overflow-visible">
              <div className="w-2.5 h-1 bg-amber-500 rounded-b animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* 3. SHADOW NINJA VECTOR CHARACTER */}
      {matchType === 'ninja' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          {/* Foot shadow */}
          <div className="absolute bottom-0 w-9 h-2 bg-black/45 rounded-full filter blur-[1px]" />
          
          {/* Main Body with Hood */}
          <div 
            className="w-10 h-[42px] relative bg-zinc-950 border-2 border-black rounded-full flex flex-col items-center justify-center overflow-visible"
            style={{ boxShadow: 'inset -2px -2px 0px rgba(255,255,255,0.05)' }}
          >
            {/* Scarf with wind wave action */}
            <div className="absolute top-1/2 -right-4 w-5 h-2 bg-red-600 border border-black rounded-r-md origin-left animate-[wiggle_1.5s_infinite_ease-in-out]" />

            {/* Golden cross katanas on back */}
            <div className="absolute -top-3 -left-2 w-4 h-5 border-l-2 border-amber-500 origin-bottom-right rotate-[30deg]" />
            <div className="absolute -top-3 -right-1 w-4 h-5 border-r-2 border-amber-500 origin-bottom-left -rotate-[30deg]" />

            {/* Mask/Hood opening with glowing eyes */}
            <div className="w-8 h-4 bg-zinc-900 border border-black rounded-lg mt-1 flex items-center justify-center gap-2 overflow-hidden relative">
              <div className="absolute inset-x-0 h-[1.5px] bg-zinc-900 border-b border-black -top-0.5" />
              
              {/* Sharp Cyan Glowing Ninja Eyes */}
              <div className="w-2 h-[2px] bg-cyan-400 rounded-full animate-pulse shadow-[0_0_4px_#22d3ee]" />
              <div className="w-2 h-[2px] bg-cyan-400 rounded-full animate-pulse shadow-[0_0_4px_#22d3ee]" />
            </div>

            {/* Interactive moving slash indicator when speaking */}
            {isSpeaking && (
              <div className="absolute -top-1 -right-2 bg-yellow-400 border border-black rounded px-1 text-[7px] text-black font-extrabold font-mono tracking-tighter uppercase animate-bounce">
                SLASH!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PRANKSTER KITTEN CHARACTER */}
      {matchType === 'kitten' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          {/* Cute shadow */}
          <div className="absolute bottom-0 w-10 h-1.5 bg-black/30 rounded-full filter blur-[1px]" />

          {/* Kitten main body face container */}
          <div 
            className="w-10 h-[38px] relative bg-amber-500 border-2 border-black rounded-[14px] flex flex-col items-center justify-center overflow-visible"
            style={{ 
              backgroundColor: themeHex, 
              boxShadow: 'inset -2px -2px 0px rgba(0, 0, 0, 0.15)' 
            }}
          >
            {/* Left/Right Pointy Cat Ears */}
            <div className="absolute -top-2.5 left-0.5 w-[14px] h-[14px] bg-amber-500 border-2 border-black rotate-[-12deg] rounded-tl-lg rounded-br-sm overflow-hidden" style={{ backgroundColor: themeHex }}>
              <div className="w-2.5 h-2.5 bg-pink-400 rounded-tl-md mt-1 ml-0.5" />
            </div>
            <div className="absolute -top-2.5 right-0.5 w-[14px] h-[14px] bg-amber-500 border-2 border-black rotate-[12deg] rounded-tr-lg rounded-bl-sm overflow-hidden" style={{ backgroundColor: themeHex }}>
              <div className="w-2.5 h-2.5 bg-pink-400 rounded-tr-md mt-1 mr-0.5" />
            </div>

            {/* Waving tail on back */}
            <div className="absolute -left-3.5 bottom-1.5 w-4 h-1.5 bg-amber-500 border border-black rounded-lg origin-right animate-[wiggle_2s_infinite_ease-in-out]" style={{ backgroundColor: themeHex }} />

            {/* Face details */}
            <div className="flex flex-col items-center mt-1">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-black rounded-full relative flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-[1px] left-[1px]" />
                </div>
                <div className="w-1.5 h-1.5 bg-black rounded-full relative flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-[1px] left-[1px]" />
                </div>
              </div>

              {/* Rosy blush cheeks + Cat whiskers */}
              <div className="absolute -left-1.5 top-5 w-1 h-[2px] bg-zinc-950 opacity-40 rounded" />
              <div className="absolute -right-1.5 top-5 w-1 h-[2px] bg-zinc-950 opacity-40 rounded" />

              {/* Mouth wye symbol */}
              <div 
                className={`transition-all ${
                  isSpeaking ? 'w-2.5 h-2 bg-red-400 rounded-b-md border border-black' : 'w-2 h-1 bg-zinc-950 rounded-b-sm'
                }`}
              />
            </div>

            {/* Gold Bell collar */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 w-3 h-3 rounded-full border border-black flex items-center justify-center">
              <div className="w-1 h-1 bg-amber-700 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* 5. MAGIC WIZARD VECTOR */}
      {matchType === 'wizard' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          <div className="absolute bottom-0 w-9 h-1.5 bg-black/35 rounded-full filter blur-[1.5px]" />

          {/* Deep Purple wizard body */}
          <div 
            className="w-9 h-11 relative bg-purple-900 border-2 border-black rounded-t-lg rounded-b-[6px] flex flex-col items-center justify-center overflow-visible"
            style={{ 
              backgroundColor: themeHex, 
              boxShadow: 'inset -2px -2px 0px rgba(0,0,0,0.3)' 
            }}
          >
            {/* Dynamic pointed purple star hat */}
            <div className="absolute -top-4 -left-1 w-11 h-6 bg-purple-950 border-2 border-black rounded-t-full rotate-[-15deg] flex items-center justify-center overflow-visible">
              <div className="absolute -top-3 left-3 w-3 h-5 bg-purple-950 border-t-2 border-l-2 border-black rounded-tl-xl rotate-[12deg]" />
              {/* Small glowing star element */}
              <div className="absolute -top-4 left-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse border border-black" />
            </div>

            {/* White long beard that sways and covers mouth */}
            <div className="w-[30px] h-5 bg-white border-2 border-black rounded-b-full absolute bottom-1 flex flex-col items-center justify-start z-15 shadow-sm animate-[wiggle_1.8s_infinite] origin-top">
              {/* Eye slot wrapper above beard */}
              <div className="w-[20px] h-[1px] bg-black/40 -mt-1" />
            </div>

            {/* Staff holding with glowing gem point */}
            <div className="absolute top-1.5 -right-3 w-[5px] h-[34px] bg-amber-800 border border-black rounded flex flex-col items-center overflow-visible">
              {/* Pulsing blue crystal gem */}
              <div className={`w-3.5 h-3.5 -mt-3.5 bg-cyan-400 border border-black rotate-45 flex items-center justify-center ${isSpeaking ? 'animate-ping' : 'animate-pulse'}`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>

            {/* Wizard mystical eyes underneath hat */}
            <div className="flex gap-2.5 -mt-3.5 relative z-10">
              <div className="w-1.5 h-[1.5px] bg-yellow-300 rounded-full animate-pulse" />
              <div className="w-1.5 h-[1.5px] bg-yellow-300 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* 6. GHOST VECTOR CHARACTER */}
      {matchType === 'ghost' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
          {/* Subtle floating shadow */}
          <div className="absolute bottom-0 w-8 h-1.5 bg-black/15 rounded-full filter blur-[2px] animate-pulse" />
          
          {/* Ghost sheet body with wave ripple bottom */}
          <div 
            className="w-9 h-[42px] relative bg-zinc-100 border-2 border-black rounded-t-full rounded-b-sm flex flex-col items-center justify-center overflow-visible animate-[bounce_1.4s_infinite_ease-in-out]"
            style={{ 
              boxShadow: 'inset -2.5px -2.5px 0px rgba(0,0,0,0.06)',
            }}
          >
            {/* Blushing cheeks and large ghost hollow eyes */}
            <div className="flex flex-col items-center justify-center gap-1 mt-1 transition-transform duration-200">
              <div className="flex gap-2.5">
                <div className="w-2.5 h-2.5 bg-black rounded-full relative flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-[1px] left-[1px]" />
                </div>
                <div className="w-2.5 h-2.5 bg-black rounded-full relative flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-[1px] left-[1px]" />
                </div>
              </div>
              
              <div className="flex justify-between w-8 -mt-2 px-1">
                <div className="w-1.5 h-[3.5px] bg-pink-300 rounded-full opacity-60" />
                <div className="w-1.5 h-[3.5px] bg-pink-300 rounded-full opacity-60" />
              </div>

              {/* Tiny open mouth display */}
              <div 
                className={`transition-all rounded-full bg-black ${
                  isSpeaking ? 'w-2 h-2.5 bg-red-400' : 'w-1.5 h-1.5'
                }`}
              />
            </div>

            {/* Floating wave ripple hemline at the bottom of sheets */}
            <div className="absolute top-full inset-x-[-1.5px] h-2 bg-transparent flex justify-around overflow-visible">
              <span className="w-2.5 h-2 bg-zinc-100 border-b-2 border-x-2 border-black rounded-b-md" />
              <span className="w-2.5 h-2 bg-zinc-100 border-b-2 border-x-2 border-black rounded-b-md" />
              <span className="w-2.5 h-2 bg-zinc-100 border-b-2 border-x-2 border-black rounded-b-md" />
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS styles supporting custom micro-animations securely */}
      <style>{`
        @keyframes slimeGlow {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.04, 0.94) translateY(2.2px); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
      `}</style>
    </div>
  );
}
