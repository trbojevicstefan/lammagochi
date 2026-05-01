import { useEffect, useRef, useState } from 'react';
import type { CreatureMood } from '../game/creatureBehavior';
import { getLevelScale, type PetSkin } from '../game/evolution';

/* ================================================================
   PixelPet v4 — AAAA Game Animation Quality
   Blink system, eyebrows, ear twitch, anticipation/follow-through,
   mood particles, micro-expressions, premium skin details
   ================================================================ */

type PetAnim = 'idle'|'happy'|'sleepy'|'eating'|'cleaning'|'playing'|'learning'|'daydreaming'|'excited'|'evolving'|'craving';
type Props = { level:number; mood:CreatureMood; dayPhase:'morning'|'day'|'evening'|'night'; isStreaming?:boolean; interactionSpark?:number; skin?:PetSkin; actionAnimation?:string|null; };

const moodToAnim: Record<CreatureMood, PetAnim> = { calm:'idle', hungry:'craving', sleepy:'sleepy', curious:'excited', dirty:'craving' };
const lerp = (a:number,b:number,t:number) => a+(b-a)*Math.min(t,1);

export const PixelPet = ({ level, mood, dayPhase, isStreaming, interactionSpark=0, skin='none', actionAnimation }: Props) => {
  const levelScale = getLevelScale(level);
  const st = (lvl:number) => ({
    isEgg:lvl<=1, isInfant:lvl>=2&&lvl<=5, isToddler:lvl>=6&&lvl<=10,
    isLearner:lvl>=11&&lvl<=18, isCompanion:lvl>=19&&lvl<=30, isSage:lvl>=31,
    hasFeet:lvl>=4, hasCrest:lvl>=7, hasHands:lvl>=12, hasWisdom:lvl>=20, hasAura:lvl>=25,
    // Stage body proportions
    bodyW: lvl<=5?34:lvl<=10?32:lvl<=18?30:28,
    bodyH: lvl<=5?28:lvl<=10?30:lvl<=18?32:34,
    headR: lvl<=5?0.6:lvl<=10?0.58:lvl<=18?0.56:0.55,
    eyeSize: lvl<=5?0.18:lvl<=10?0.15:lvl<=18?0.14:0.13,
    mouthY: lvl<=5?43:lvl<=10?42:lvl<=18?41:40,
  });
  const si = st(level);
  const resolvedAnim: PetAnim = (actionAnimation as PetAnim) || moodToAnim[mood];
  const isNight = dayPhase === 'night';

  // Animation state (lerped)
  // Expression blend targets (game-quality smooth transitions)
  const exprRef = useRef({ eyeH:8, eyeY:31, squint:0, browY:0, browAngle:0, mouthW:4, mouthH:1.5, mouthY:43, mouthCurve:0, blushA:0.2, pupilH:5 });
  const aRef = useRef({ bx:0,by:0,sx:1,sy:1,wiggle:0,sway:0,flash:0,blink:0,earL:0,earR:0,antic:0,tailWag:0,idleVariant:0,pupilSize:1,headTilt:0,noseTwitch:0,eyeDartX:0,shimmerPos:0 });
  const [renderTick, setRender] = useState(0);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const lastSpark = useRef(0);
  const blinkTimer = useRef(0);
  const blinkState = useRef<'open'|'closing'|'closed'|'opening'>('open');
  const blinkCount = useRef(0);
  const nextBlinkAt = useRef(2000 + Math.random()*3000);
  const earTwitchTimer = useRef(0);
  const earTwitchTarget = useRef<'none'|'left'|'right'>('none');
  const nextEarTwitchAt = useRef(3000 + Math.random()*5000);
  const idleVariantTimer = useRef(0);
  const idleVariantType = useRef<'normal'|'stretch'|'look'|'wiggle'>('normal');
  const nextIdleVariantAt = useRef(4000 + Math.random()*6000);
  const tailWagIntensity = useRef(0);
  // Micro-animation timers
  const headTiltTimer = useRef(0);
  const headTiltTarget = useRef(0);
  const nextHeadTiltAt = useRef(5000+Math.random()*8000);
  const noseTwitchTimer = useRef(0);
  const nextNoseTwitchAt = useRef(3000+Math.random()*5000);
  const eyeDartTimer = useRef(0);
  const eyeDartTarget = useRef(0);
  const nextEyeDartAt = useRef(2000+Math.random()*4000);
  const shimmerTimer = useRef(0);
  const animStart = useRef(0);
  const prevAnim = useRef<PetAnim>('idle');
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Detect animation changes for anticipation
  useEffect(() => { if(resolvedAnim!==prevAnim.current){ animStart.current=performance.now(); prevAnim.current=resolvedAnim; aRef.current.antic=0; } },[resolvedAnim]);

  // 60fps loop
  useEffect(() => {
    let last = performance.now();
    const tick = (now:number) => {
      const dt = Math.min((now-last)/1000, 0.05); last=now;
      frameRef.current += dt;
      const t = frameRef.current;
      const anim = resolvedAnim;
      const elapsed = (now - animStart.current)/1000;

      // === BLINK SYSTEM ===
      blinkTimer.current += dt*1000;
      if(blinkState.current==='open' && blinkTimer.current >= nextBlinkAt.current){
        blinkState.current='closing'; blinkTimer.current=0;
      }
      if(blinkState.current==='closing' && blinkTimer.current>40){ blinkState.current='closed'; blinkTimer.current=0; blinkCount.current++; }
      if(blinkState.current==='closed' && blinkTimer.current>60+(blinkCount.current%3===0?80:0)){ blinkState.current='opening'; blinkTimer.current=0; }
      if(blinkState.current==='opening' && blinkTimer.current>40){ blinkState.current='open'; blinkTimer.current=0; nextBlinkAt.current=2000+Math.random()*4000; }
      // Blink value: 0=open, 1=closed
      const blinkVal = blinkState.current==='closing'?Math.min(1,blinkTimer.current/40):blinkState.current==='closed'?1:blinkState.current==='opening'?Math.max(0,1-blinkTimer.current/40):0;
      aRef.current.blink = lerp(aRef.current.blink, blinkVal, 0.6);

      // === EAR TWITCH ===
      earTwitchTimer.current += dt*1000;
      if(earTwitchTarget.current==='none' && earTwitchTimer.current>=nextEarTwitchAt.current){
        earTwitchTarget.current = Math.random()<0.5?'left':'right'; earTwitchTimer.current=0;
      }
      if(earTwitchTarget.current!=='none' && earTwitchTimer.current>180){ earTwitchTarget.current='none'; nextEarTwitchAt.current=3000+Math.random()*7000; earTwitchTimer.current=0; }
      const twitchPhase = earTwitchTarget.current!=='none'?Math.sin(earTwitchTimer.current/180*Math.PI)*0.15:0;
      aRef.current.earL = lerp(aRef.current.earL, earTwitchTarget.current==='left'?twitchPhase:0, 0.3);
      aRef.current.earR = lerp(aRef.current.earR, earTwitchTarget.current==='right'?twitchPhase:0, 0.3);

      // === IDLE VARIANTS (stretch, look-around, wiggle) ===
      if(anim==='idle'){
        idleVariantTimer.current += dt*1000;
        if(idleVariantTimer.current >= nextIdleVariantAt.current){
          const variants: Array<'normal'|'stretch'|'look'|'wiggle'> = ['normal','stretch','look','wiggle'];
          idleVariantType.current = variants[Math.floor(Math.random()*variants.length)];
          idleVariantTimer.current = 0;
          nextIdleVariantAt.current = 5000 + Math.random()*10000;
        }
        // Apply variant effect
        const variantPhase = idleVariantTimer.current < 1500 ? idleVariantTimer.current/1500 : 1 - Math.min(1,(idleVariantTimer.current-1500)/500);
        const vi = idleVariantType.current === 'stretch' ? variantPhase*2 : idleVariantType.current === 'wiggle' ? variantPhase*1.5 : 0;
        aRef.current.idleVariant = lerp(aRef.current.idleVariant, vi, 0.15);
        // Look-around: subtle pupil dart
        if(idleVariantType.current === 'look' && idleVariantTimer.current < 1500){
          // Pupil dart effect applied via wiggle below
        }
      } else { aRef.current.idleVariant = lerp(aRef.current.idleVariant,0,0.1); }

      // === TAIL WAG (intensity based on mood/happiness) ===
      const tailTarget = anim==='happy'?0.5:anim==='excited'||anim==='playing'?0.8:anim==='idle'?0.15:0.05;
      tailWagIntensity.current = lerp(tailWagIntensity.current, tailTarget, 0.05);
      aRef.current.tailWag = Math.sin(t*4.5)*tailWagIntensity.current;

      // === HEAD TILT (occasional gentle tilt) ===
      headTiltTimer.current += dt*1000;
      if(headTiltTimer.current >= nextHeadTiltAt.current){
        headTiltTarget.current = (Math.random()-0.5)*0.04;
        headTiltTimer.current = 0;
        nextHeadTiltAt.current = 5000+Math.random()*10000;
      }
      // Fade tilt back to 0 over time
      headTiltTarget.current *= 0.995;
      aRef.current.headTilt = lerp(aRef.current.headTilt, headTiltTarget.current, 0.05);

      // === NOSE TWITCH (tiny rapid pulse) ===
      noseTwitchTimer.current += dt*1000;
      if(noseTwitchTimer.current >= nextNoseTwitchAt.current){
        noseTwitchTimer.current = 0;
        nextNoseTwitchAt.current = 4000+Math.random()*8000;
      }
      const nosePhase = noseTwitchTimer.current < 120 ? Math.sin(noseTwitchTimer.current/120*Math.PI)*0.3 : 0;
      aRef.current.noseTwitch = lerp(aRef.current.noseTwitch, nosePhase, 0.4);

      // === EYE DART (pupils shift slightly) ===
      eyeDartTimer.current += dt*1000;
      if(eyeDartTimer.current >= nextEyeDartAt.current){
        eyeDartTarget.current = (Math.random()-0.5)*2;
        eyeDartTimer.current = 0;
        nextEyeDartAt.current = 1500+Math.random()*3500;
      }
      aRef.current.eyeDartX = lerp(aRef.current.eyeDartX, eyeDartTarget.current, 0.15);

      // === BODY SHIMMER (light line sweeps across) ===
      shimmerTimer.current += dt*1000;
      aRef.current.shimmerPos = (Math.sin(shimmerTimer.current*0.6)*0.5+0.5);

      // === PUPIL DILATION (bigger when happy/excited, smaller when sad/sleepy) ===
      const pupilTarget = anim==='happy'||anim==='excited'||anim==='playing'?1.3:anim==='sleepy'||anim==='craving'?0.8:1.0;
      aRef.current.pupilSize = lerp(aRef.current.pupilSize, pupilTarget, 0.1);

      // === ANTICIPATION (lean-in before actions) ===
      const shouldAnticipate = anim!=='idle'&&anim!=='sleepy'&&anim!=='evolving'&&anim!=='daydreaming'&&anim!=='craving';
      const anticTarget = shouldAnticipate&&elapsed<0.25?Math.sin(elapsed/0.25*Math.PI*0.5)*0.6:0;
      aRef.current.antic = lerp(aRef.current.antic, anticTarget, 0.2);

      // === TARGET ANIMATION VALUES ===
      const tg = { bx:0,by:0,sx:1,sy:1,wiggle:0,sway:0,flash:0 };
      const bSpeed = si.isEgg?0.9:0.4;
      tg.by = Math.sin(t*bSpeed*Math.PI*2)*1.0;
      tg.sx = 1+Math.cos(t*bSpeed*Math.PI*2)*0.005;
      tg.sy = 1-Math.sin(t*bSpeed*Math.PI*2)*0.006;
      if(anim==='excited'||anim==='playing'){ const b=Math.abs(Math.sin(t*2.5))*5; tg.by=-b; tg.sy=1+b/70; tg.sx=1-b/90; }
      if(anim==='happy'){ tg.by=Math.sin(t*2.8)*1.2; tg.wiggle=Math.sin(t*2.8)*1.2; }
      if(anim==='sleepy'||anim==='daydreaming'){ tg.sway=Math.sin(t*0.9)*1.5; }
      if(anim==='craving'){ tg.wiggle=Math.sin(t*5)*0.8; tg.by=Math.sin(t*6)*0.6; }
      if(anim==='evolving'){ tg.sx=1+Math.sin(t*2)*0.03; tg.sy=1+Math.sin(t*2)*0.03; tg.flash=0.35+Math.sin(t*4)*0.25; }
      // Eating: quick lean forward then settle
      if(anim==='eating'){ tg.by=elapsed<0.3?-2-Math.sin(elapsed/0.3*Math.PI)*2:Math.sin(t*0.5)*0.5; }
      // Learning: focused stillness
      if(anim==='learning'){ tg.by=Math.sin(t*0.3)*0.4; tg.sx=0.995; tg.sy=1.005; }
      // Follow-through bounce after action
      const followThrough = !shouldAnticipate&&elapsed>0&&elapsed<0.5?Math.sin((elapsed-0.25)/0.25*Math.PI)*1.5*(1-elapsed/0.5):0;
      if(followThrough>0&&anim==='idle'){ tg.by+=followThrough; }
      // Look-around idle variant: pupil dart effect
      if(anim==='idle'&&idleVariantType.current==='look'&&idleVariantTimer.current<1500){
        tg.wiggle += Math.sin(idleVariantTimer.current/200*Math.PI)*0.6;
      }

      // Blend body animation
      const c=aRef.current;
      c.bx=lerp(c.bx,tg.bx,0.10); c.by=lerp(c.by,tg.by,0.10);
      c.sx=lerp(c.sx,tg.sx,0.08); c.sy=lerp(c.sy,tg.sy,0.08);
      c.wiggle=lerp(c.wiggle,tg.wiggle,0.08); c.sway=lerp(c.sway,tg.sway,0.06);
      c.flash=lerp(c.flash,tg.flash,0.06);

      // === EXPRESSION BLEND TARGETS (game-quality face) ===
      const e = exprRef.current;
      const eTgt = { eyeH:8, eyeY:31, squint:0, browY:0, browAngle:0, mouthW:4, mouthH:1.5, mouthY:43, mouthCurve:0, blushA:0.2, pupilH:5 };
      if(anim==='happy'||anim==='playing'){ eTgt.eyeH=5; eTgt.eyeY=33; eTgt.squint=0.7; eTgt.browY=-1; eTgt.mouthW=6; eTgt.mouthH=3; eTgt.mouthCurve=1; eTgt.blushA=0.8; }
      if(anim==='excited'){ eTgt.eyeH=9; eTgt.eyeY=30; eTgt.squint=0; eTgt.browY=-2; eTgt.mouthW=8; eTgt.mouthH=6; eTgt.mouthCurve=0; eTgt.blushA=0.6; eTgt.pupilH=6; }
      if(anim==='craving'){ eTgt.eyeH=7; eTgt.eyeY=32; eTgt.squint=0.3; eTgt.browY=1.5; eTgt.browAngle=-8; eTgt.mouthW=6; eTgt.mouthH=1.5; eTgt.mouthY=44; eTgt.mouthCurve=-1; eTgt.blushA=0.3; }
      if(anim==='sleepy'||anim==='daydreaming'){ eTgt.eyeH=2; eTgt.eyeY=34; eTgt.browY=0; eTgt.mouthW=8; eTgt.mouthH=3; eTgt.mouthY=43; eTgt.mouthCurve=0; eTgt.blushA=0.15; }
      if(anim==='eating'){ eTgt.eyeH=6; eTgt.eyeY=32; eTgt.squint=0.5; eTgt.mouthW=8; eTgt.mouthH=3; eTgt.mouthCurve=0; eTgt.blushA=0.3; }
      if(anim==='cleaning'){ eTgt.eyeH=8; eTgt.eyeY=31; eTgt.squint=0; eTgt.mouthW=4; eTgt.mouthH=1.5; eTgt.mouthCurve=0.5; eTgt.blushA=0.3; }
      if(anim==='learning'){ eTgt.eyeH=7; eTgt.eyeY=32; eTgt.squint=0.1; eTgt.browY=0; eTgt.mouthW=2; eTgt.mouthH=1.5; eTgt.blushA=0.15; }
      if(anim==='evolving'){ eTgt.eyeH=9; eTgt.eyeY=30; eTgt.squint=0; eTgt.browY=-1; eTgt.mouthW=8; eTgt.mouthH=5; eTgt.mouthCurve=0; eTgt.blushA=0.4; eTgt.pupilH=6; }
      // Blend expressions smoothly (slower blend = more natural)
      e.eyeH=lerp(e.eyeH,eTgt.eyeH,0.08); e.eyeY=lerp(e.eyeY,eTgt.eyeY,0.08);
      e.squint=lerp(e.squint,eTgt.squint,0.06); e.browY=lerp(e.browY,eTgt.browY,0.06);
      e.browAngle=lerp(e.browAngle,eTgt.browAngle,0.04); e.mouthW=lerp(e.mouthW,eTgt.mouthW,0.08);
      e.mouthH=lerp(e.mouthH,eTgt.mouthH,0.08); e.mouthY=lerp(e.mouthY,eTgt.mouthY,0.08);
      e.mouthCurve=lerp(e.mouthCurve,eTgt.mouthCurve,0.06); e.blushA=lerp(e.blushA,eTgt.blushA,0.06);
      e.pupilH=lerp(e.pupilH,eTgt.pupilH,0.08);

      setRender(Math.floor(frameRef.current*25)%10000);
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[resolvedAnim,level]);

  // Interaction spark
  useEffect(()=>{ if(interactionSpark>0&&interactionSpark!==lastSpark.current){ lastSpark.current=interactionSpark; aRef.current.flash=1; if(flashTimeout.current)clearTimeout(flashTimeout.current); flashTimeout.current=setTimeout(()=>{aRef.current.flash=0;},400); } },[interactionSpark]);

  const { bx,by,sx,sy,wiggle,sway,flash,blink,earL,earR,antic,tailWag,idleVariant,pupilSize,headTilt,noseTwitch,eyeDartX,shimmerPos } = aRef.current;
  const brightness = isNight?0.55+flash*0.45:1+flash*2.5;
  const contrast = resolvedAnim==='evolving'?1.3+flash*0.5:flash>0.05?2+flash*3:1;

  // Skin colors
  const sm: Record<string,[string,string,string]> = {
    none:[si.isSage?'#312e81':'#6366f1','#818cf8','#4f46e5'],
    wizard:['#7e22ce','#a855f7','#581c87'], ninja:['#1e293b','#334155','#0f172a'],
    astronaut:['#e2e8f0','#f8fafc','#94a3b8'], aurora:['#06b6d4','#67e8f9','#0891b2'],
    inferno:['#ef4444','#fca5a5','#991b1b'], ocean:['#2563eb','#93c5fd','#1e3a5f'],
    forest:['#16a34a','#86efac','#14532d'],
  };
  const [bodyMain,bodyLight,bodyDark]=sm[skin]||sm.none;

  // Expression values (lerped, game-quality)
  const { eyeH:exEyeH, eyeY:exEyeY, squint:exSquint, browY:exBrowY, browAngle:exBrowA, mouthW:exMouthW, mouthH:exMouthH, mouthY:exMouthY, mouthCurve:exMouthCurve, blushA:exBlushA, pupilH:exPupilH } = exprRef.current;
  // Legacy booleans (keep for now, will be removed when SVG face is migrated to expression system)
  const isHappy = resolvedAnim==='happy'||resolvedAnim==='playing';
  const isSad = resolvedAnim==='craving';
  const isSleepy = resolvedAnim==='sleepy'||resolvedAnim==='daydreaming';
  const isExcited = resolvedAnim==='excited';
  const isEating = resolvedAnim==='eating';
  const isCleaning = resolvedAnim==='cleaning';
  const isLearning = resolvedAnim==='learning';
  const isEvolving = resolvedAnim==='evolving';
  const browY = isHappy?-1:isSad?1:isSleepy?-0.5:isExcited?-1.5:0;
  const browAngle = isSad?'rotate(-10 24 30)':isExcited?'rotate(-4 24 30)':'';
  const browAngleR = isSad?'rotate(10 40 30)':isExcited?'rotate(4 40 30)':'';

  return (
    <div className="pixel-pet-wrapper" style={{
      width:`${256*levelScale}px`, height:`${256*levelScale}px`,
      filter:`brightness(${brightness}) contrast(${contrast}) drop-shadow(0 12px 20px rgba(0,0,0,0.4))`,
      transition:flash>0.05?'none':'filter 0.4s ease-out',
    }}>
      {/* Floor shadow */}
      <div className="pixel-pet-shadow" style={{transform:`scaleX(${1-by*0.04})translateX(${-sway*0.3}px)`,opacity:(resolvedAnim==='excited'||resolvedAnim==='playing')?0.12:0.45*(isNight?0.55:1)}}/>

      {/* Mood particles — slow, subtle, away from face */}
      {isHappy && <EmotionParticles type="hearts" count={1} />}
      {isExcited && <EmotionParticles type="sparkles" count={2} />}
      {isSleepy && <EmotionParticles type="z" count={1} />}
      {isEvolving && <EmotionParticles type="stars" count={3} />}

      <svg viewBox="0 0 64 64" className="pixel-pet-svg" shapeRendering="crispEdges">
        {/* Cosmic aura */}
        {si.hasAura&&(<g style={{transformOrigin:'32px 32px',animation:'aura-spin 14s linear infinite'}}>
          <ellipse cx="32" cy="32" rx="28" ry="12" fill="none" stroke={skin==='aurora'?'#67e8f9':'#06b6d4'} strokeWidth="1" strokeDasharray="5 5" opacity="0.6"/>
          <ellipse cx="32" cy="32" rx="12" ry="28" fill="none" stroke={skin==='aurora'?'#a78bfa':'#818cf8'} strokeWidth="1" strokeDasharray="5 5" opacity="0.5"/>
        </g>)}

        {/* Main sprite — anticipation lean + all transforms */}
        <g style={{transform:`translate(32px,56px)scale(${sx},${sy})translate(-32px,-56px)rotate(${headTilt}deg)translateY(${by-antic}px)translateX(${wiggle-sway}px)`}}>
          {/* === EGG === */}
          {si.isEgg&&(<g>
            <ellipse cx="32" cy="40" rx="14" ry="17" fill="#f8fafc"/>
            <ellipse cx="27" cy="33" rx="5" ry="7" fill="white" opacity="0.4"/>
            <rect x="25" y="31" width="3" height="2" fill="#e2e8f0" rx="0.5"/>
            <rect x="34" y="36" width="4" height="2" fill="#e2e8f0" rx="0.5"/>
            <rect x="27" y="45" width="5" height="2" fill="#e2e8f0" rx="0.5"/>
          </g>)}

          {/* === POST-EGG === */}
          {!si.isEgg&&(<>
            {/* Ninja sword behind body */}
            {skin==='ninja'&&(<g><rect x="10" y="10" width="4" height="28" transform="rotate(-30 12 24)" fill="#cbd5e1"/><rect x="8" y="34" width="8" height="4" transform="rotate(-30 12 24)" fill="#334155"/></g>)}

            {/* Inferno flames behind */}
            {skin==='inferno'&&(<g>
              <rect x="26" y="14" width="4" height="8" fill="#fbbf24" rx="1" opacity="0.7"/>
              <rect x="28" y="10" width="8" height="6" fill="#f59e0b" rx="1" opacity="0.6"/>
              <rect x="34" y="16" width="4" height="5" fill="#fbbf24" rx="1" opacity="0.5"/>
            </g>)}

            {/* Crest/hair with delayed motion */}
            {si.hasCrest&&(<g style={{transform:`translateY(${Math.sin(frameRef.current*1.4+1)*2}px)`}}>
              <rect x="27" y="13" width="10" height="12" fill={skin==='inferno'?'#f59e0b':skin==='ocean'?'#3b82f6':skin==='forest'?'#22c55e':si.isSage?'#06b6d4':'#fbbf24'} rx="1"/>
              <rect x="29" y="9" width="6" height="4" fill={skin==='inferno'?'#fbbf24':skin==='ocean'?'#60a5fa':skin==='forest'?'#4ade80':si.isSage?'#22d3ee':'#f59e0b'} rx="1"/>
              <rect x="30" y="10" width="3" height="2" fill="#fef3c7"/>
              {skin==='wizard'&&(<g style={{transform:'translateY(-6px)'}}><polygon points="32,0 14,22 50,22" fill="#7e22ce"/><rect x="6" y="22" width="52" height="4" rx="2" fill="#6b21a8"/><rect x="27" y="8" width="10" height="7" fill="#facc15" rx="1"/></g>)}
              {skin==='aurora'&&(<g><rect x="25" y="7" width="4" height="4" fill="#67e8f9" opacity="0.6"/><rect x="31" y="5" width="3" height="3" fill="#a78bfa" opacity="0.5"/><rect x="35" y="7" width="4" height="4" fill="#67e8f9" opacity="0.4"/></g>)}
            </g>)}

            {/* Feet — positioned under body */}
            {si.hasFeet&&(<g>
              <rect x={32-si.bodyW/2+4} y={22+si.bodyH-4} width={10} height={5} fill={bodyDark} rx="1"/>
              <rect x={32+si.bodyW/2-14} y={22+si.bodyH-4} width={10} height={5} fill={bodyDark} rx="1"/>
              <rect x={32-si.bodyW/2+5} y={22+si.bodyH-5} width={8} height={2} fill={bodyLight}/>
              <rect x={32+si.bodyW/2-13} y={22+si.bodyH-5} width={8} height={2} fill={bodyLight}/>
            </g>)}

            {/* Tail (child+) */}
            {si.hasCrest && (
              <g style={{transform:`translate(2px,${38-idleVariant}px)rotate(${20+tailWag*25}deg)`,transformOrigin:'5px 40px'}}>
                <rect x="5" y="38" width="6" height="12" fill={bodyDark} rx="2"/>
                <rect x="4" y="44" width="4" height="6" fill={bodyLight} rx="1"/>
                {/* Tail tip fluff */}
                {si.hasWisdom && <rect x="3" y="48" width="6" height="4" fill={bodyMain} rx="2"/>}
              </g>
            )}

            {/* MAIN BODY — stage-proportioned */}
            <rect x={32-si.bodyW/2} y={22} width={si.bodyW} height={si.bodyH} rx={si.isInfant?9:7} fill={bodyMain}/>
            <rect x={32-si.bodyW/2+2} y={20} width={si.bodyW-4} height={si.bodyH+4} rx={si.isInfant?9:7} fill={bodyMain}/>
            <rect x={32-si.bodyW/2+2} y={22} width={si.bodyW-8} height={5} rx="2" fill={bodyLight} opacity="0.7"/>
            <rect x={32-si.bodyW/2+2+shimmerPos*(si.bodyW-12)} y={24} width={4} height={2} fill="white" opacity={0.06+Math.sin(shimmerPos*Math.PI)*0.04} rx="1"/>
            <rect x={32-si.bodyW/2} y={28} width={4} height={si.bodyH-12} rx="1" fill={bodyDark} opacity="0.6"/>

            {/* Ninja headband */}
            {skin==='ninja'&&(<g><rect x="13" y="26" width="38" height="4" fill="#dc2626"/><rect x="6" y={26+Math.sin(frameRef.current*2)*1} width="7" height="2" fill="#b91c1c"/></g>)}

            {/* Forest leaves on body */}
            {skin==='forest'&&(<g opacity="0.7">
              <rect x="38" y="24" width="5" height="5" fill="#22c55e" rx="1"/><rect x="40" y="22" width="3" height="4" fill="#4ade80" rx="0.5"/>
              <rect x="22" y="44" width="4" height="4" fill="#16a34a" rx="1"/>
            </g>)}

            {/* Stage-specific body markings */}
            {level>=6&&level<=10&&(<rect x="30" y="44" width="4" height="3" fill={bodyDark} opacity="0.3" rx="1"/>)}
            {level>=11&&level<=18&&(<g opacity="0.3"><rect x="36" y="26" width="8" height="1" fill={bodyDark}/><rect x="38" y="28" width="4" height="1" fill={bodyDark}/></g>)}
            {level>=19&&level<=30&&(<rect x="28" y="36" width="3" height="3" fill="#f472b6" opacity="0.4" rx="1"/>)}
            {level>=31&&(<rect x="44" y="22" width="4" height="4" fill="#facc15" opacity="0.5" rx="1"/>)}
            {/* Wisdom lines */}
            {si.hasWisdom&&(<g opacity="0.35"><rect x="23" y="24" width="18" height="1" fill={bodyDark}/><rect x="25" y="26" width="14" height="1" fill={bodyDark}/><rect x="24" y="28" width="16" height="1" fill={bodyDark}/></g>)}

            {/* Astronaut chest */}
            {skin==='astronaut'&&(<g><rect x="23" y="40" width="18" height="11" rx="2" fill="#f1f5f9" opacity="0.9"/><rect x="25" y="42" width="3" height="3" fill="#ef4444"/><rect x="30" y="42" width="8" height="3" fill="#3b82f6"/></g>)}

            {/* Ocean ripples */}
            {skin==='ocean'&&(<g opacity="0.4"><rect x="18" y="40" width="28" height="1" fill="#93c5fd"/><rect x="20" y="42" width="24" height="1" fill="#60a5fa"/></g>)}

            {/* ====== FACE GROUP — Clean, emotion-rich ====== */}
            <g style={{transform:`translateY(${isSad?0.5:0}px)`}}>
              {/* EYEBROWS — expression-driven */}
              {!si.isEgg&&(<>
                <g transform={`rotate(${exBrowA} 24 30)`}>
                  <rect x="20" y={30+exBrowY} width="8" height="2" fill={bodyDark} rx="1"/>
                </g>
                <g transform={`rotate(${-exBrowA} 40 30)`}>
                  <rect x="36" y={30+exBrowY} width="8" height="2" fill={bodyDark} rx="1"/>
                </g>
              </>)}

              {/* EYES — expression-driven */}
              {exEyeH<=2.5?(<>
                <rect x="21" y={exEyeY} width="8" height={exEyeH} fill="#1e1b4b" rx="1"/>
                <rect x="35" y={exEyeY} width="8" height={exEyeH} fill="#1e1b4b" rx="1"/>
              </>):(<>
                <rect x="20" y={exEyeY} width="10" height={exEyeH*(1-blink*0.95)} fill="white" rx="1"/>
                <rect x="34" y={exEyeY} width="10" height={exEyeH*(1-blink*0.95)} fill="white" rx="1"/>
                {exSquint>0.1&&(<>
                  <rect x="20" y={exEyeY} width="10" height={Math.round(exSquint*4)} fill={bodyMain} rx="1"/>
                  <rect x="34" y={exEyeY} width="10" height={Math.round(exSquint*4)} fill={bodyMain} rx="1"/>
                </>)}
                {blink<0.6&&(<>
                  <rect x={23+antic+eyeDartX} y={exEyeY+2} width={5*pupilSize} height={Math.max(1,exPupilH*pupilSize*(1-blink))} fill="#1e1b4b" rx="0.5"/>
                  <rect x={37+antic+eyeDartX} y={exEyeY+2} width={5*pupilSize} height={Math.max(1,exPupilH*pupilSize*(1-blink))} fill="#1e1b4b" rx="0.5"/>
                  <rect x={25} y={exEyeY+2} width="2" height="2" fill="white"/>
                  <rect x={39} y={exEyeY+2} width="2" height="2" fill="white"/>
                </>)}
              </>)}

              {/* Blush — expression-driven opacity */}
              {!si.isEgg&&<g opacity={exBlushA}>
                <rect x="17" y="38" width="5" height="2" fill={skin==='inferno'?'#fca5a5':'#f472b6'} rx="0.5"/>
                <rect x="42" y="38" width="5" height="2" fill={skin==='inferno'?'#fca5a5':'#f472b6'} rx="0.5"/>
              </g>}

              {/* MOUTH — expression-driven width, height, position, curve */}
              {exMouthCurve>0.5?(<>
                <rect x={32-Math.round(exMouthW/2)} y={exMouthY} width={Math.round(exMouthW)} height={Math.round(exMouthH)} fill="#1e1b4b" rx="1"/>
                <rect x={32-Math.round(exMouthW/2)-1.5} y={exMouthY-1} width="1.5" height="2" fill="#1e1b4b" rx="0.5"/>
                <rect x={32+Math.round(exMouthW/2)} y={exMouthY-1} width="1.5" height="2" fill="#1e1b4b" rx="0.5"/>
              </>):exMouthCurve<-0.5?(<>
                <rect x={32-Math.round(exMouthW/2)} y={exMouthY} width={Math.round(exMouthW)} height={Math.round(exMouthH)} fill="#1e1b4b" rx="0.5"/>
              </>):exMouthH>4?(<>
                <rect x={32-Math.round(exMouthW/2)} y={exMouthY} width={Math.round(exMouthW)} height={Math.round(exMouthH)} fill="#1e1b4b" rx="1"/>
                <rect x={32-Math.round(exMouthW/2)+1} y={exMouthY+Math.round(exMouthH/2)} width={Math.round(exMouthW)-2} height={Math.round(exMouthH/2)-0.5} fill="#ef4444" rx="0.5"/>
              </>):(<>
                <rect x={32-Math.round(exMouthW/2)} y={exMouthY} width={Math.round(exMouthW)} height={Math.round(exMouthH)} fill="#1e1b4b" rx="0.5"/>
              </>)}
            </g>

            {/* Hands */}
            {si.hasHands&&(<g>
              <rect x="8" y={34+(resolvedAnim==='excited'||resolvedAnim==='playing'?-8:0)} width="8" height="8" rx="2" fill={si.isSage?'#6366f1':skin==='astronaut'?'#f1f5f9':bodyLight}/>
              <rect x="48" y={34+(resolvedAnim==='excited'||resolvedAnim==='playing'?-8:0)} width="8" height="8" rx="2" fill={si.isSage?'#6366f1':skin==='astronaut'?'#f1f5f9':bodyLight}/>
            </g>)}

            {/* Astronaut helmet */}
            {skin==='astronaut'&&(<g><rect x="8" y="12" width="48" height="42" rx="20" fill="#7dd3fc" opacity="0.25"/><rect x="12" y="16" width="14" height="7" rx="3" fill="white" opacity="0.35"/></g>)}
          </>)}
        </g>

        {/* ===== PROPS (outside transform group) ===== */}
        {resolvedAnim==='eating'&&!si.isEgg&&(<g style={{transform:`translate(22px,${36+by}px)`}}>
          <rect x="0" y="0" width="12" height="12" fill={skin==='inferno'?'#ef4444':'#f59e0b'} rx="1"/>
          <rect x="2" y="2" width="8" height="8" fill={skin==='inferno'?'#dc2626':'#b45309'} rx="1"/>
          <rect x="4" y="4" width="4" height="4" fill="#fef3c7"/>
        </g>)}
        {resolvedAnim==='playing'&&si.hasHands&&(<g style={{transform:`translate(44px,${30+by}px)`}}>
          <rect x="0" y="0" width="12" height="12" fill={skin==='ocean'?'#3b82f6':skin==='forest'?'#22c55e':'#fbbf24'} rx="1"/>
          <rect x="1" y="1" width="4.5" height="4.5" fill={skin==='ocean'?'#2563eb':skin==='forest'?'#16a34a':'#f59e0b'}/>
          <rect x="6.5" y="1" width="4.5" height="4.5" fill="#fef3c7"/>
          <rect x="1" y="6.5" width="4.5" height="4.5" fill="#fde68a"/>
          <rect x="6.5" y="6.5" width="4.5" height="4.5" fill={skin==='ocean'?'#2563eb':'#f59e0b'}/>
        </g>)}
        {resolvedAnim==='learning'&&si.hasHands&&(<g style={{transform:`translate(12px,${28+by}px)`}}>
          <rect x="0" y="0" width="15" height="12" fill={skin==='aurora'?'#06b6d4':'#c084fc'} rx="1"/>
          <rect x="1.5" y="1.5" width="5.5" height="9" fill="#fef3c7"/><rect x="8" y="1.5" width="5.5" height="9" fill="#fef3c7"/>
          <rect x="2.5" y="2.5" width="3.5" height="2" fill={skin==='aurora'?'#67e8f9':'#a78bfa'}/>
          <rect x="9" y="3.5" width="3.5" height="2" fill={skin==='aurora'?'#67e8f9':'#a78bfa'}/>
        </g>)}
        {resolvedAnim==='cleaning'&&(<g style={{transform:`translate(26px,${24+by}px)`}}>
          {[0,1,2,3,4].map(i=><circle key={i} cx={i*4+Math.sin(frameRef.current*3+i)*2} cy={i*3+Math.cos(frameRef.current*2+i)*2} r={6-i*0.8} fill="#bae6fd" opacity={0.55-i*0.1}/>)}
        </g>)}
        {resolvedAnim==='daydreaming'&&(<g style={{transform:`translate(44px,${14+by+sway}px)`}}>
          <circle cx="0" cy="0" r="6" fill={skin==='aurora'?'#67e8f9':'#c084fc'} opacity="0.4"/>
          <circle cx="9" cy="-7" r="5" fill={skin==='aurora'?'#a78bfa':'#a78bfa'} opacity="0.3"/>
          <circle cx="16" cy="-14" r="4" fill={skin==='aurora'?'#c084fc':'#818cf8'} opacity="0.2"/>
          <text x="5" y="-2" fontSize="7" fill={skin==='aurora'?'#67e8f9':'#a78bfa'} fontFamily="monospace" fontWeight="bold">z</text>
        </g>)}
        {resolvedAnim==='excited'&&si.hasHands&&(<g style={{transform:`translate(42px,${26+by}px)`}}>
          {skin==='wizard'?(<><rect x="0" y="-18" width="2.5" height="20" fill="#854d0e"/><rect x="-3" y="-22" width="8" height="8" fill="#facc15" rx="1"/><rect x="-1" y="-20" width="4" height="4" fill="#fef3c7"/></>)
          :(<><rect x="2" y="0" width="5" height="14" fill="#cbd5e1" rx="1"/><rect x="0" y="0" width="9" height="3.5" fill="#334155" rx="0.5"/><rect x="0" y="10.5" width="9" height="3.5" fill="#334155" rx="0.5"/></>)}
        </g>)}
      </svg>

      <style>{`
        .pixel-pet-wrapper{position:relative;display:flex;align-items:center;justify-content:center;image-rendering:pixelated;image-rendering:crisp-edges;}
        .pixel-pet-svg{width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;z-index:2;}
        .pixel-pet-shadow{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);width:90px;height:12px;background:rgba(0,0,0,0.3);border-radius:50%;filter:blur(7px);z-index:1;}
        @keyframes aura-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes float-up{0%{transform:translateY(0)scale(0.5);opacity:0}10%{opacity:0.35}30%{opacity:0.2}100%{transform:translateY(-80px)scale(0.3);opacity:0}}
      `}</style>
    </div>
  );
};

// Emotion particle component
const PARTICLE_COLORS: Record<string,string> = { hearts:'#f472b6', sparkles:'#fbbf24', sweat:'#60a5fa', z:'#818cf8', stars:'#facc15' };
const PARTICLE_ICONS: Record<string,string> = { hearts:'♥', sparkles:'✦', sweat:'💧', z:'z', stars:'★' };

const EmotionParticles = ({ type, count }: { type: string; count: number }) => (
  <div style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',overflow:'hidden'}}>
    {Array.from({length:count}).map((_,i)=>(
      <span key={i} style={{
        position:'absolute',left:`${40+Math.random()*20}%`,top:`${60+Math.random()*15}%`,
        color:PARTICLE_COLORS[type]||'#fff',fontSize:`${7+Math.random()*5}px`,
        animation:`float-up ${4+Math.random()*3}s ease-out ${i*2+Math.random()*2}s infinite`,
        opacity:0,
      }}>{PARTICLE_ICONS[type]||'•'}</span>
    ))}
  </div>
);
