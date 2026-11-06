import {useEffect,useState} from 'react';
import {ShaderGradient,ShaderGradientCanvas} from '@shadergradient/react';
import './ambientBackground.css';

export default function AmbientBackground(){
  const [reduceMotion,setReduceMotion]=useState(false);

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduceMotion(media.matches);
    update();
    media.addEventListener?.('change',update);
    return()=>media.removeEventListener?.('change',update);
  },[]);

  return <div className="csp-ambient-background" aria-hidden="true">
    <ShaderGradientCanvas
      style={{position:'absolute',inset:0}}
      pixelDensity={1}
      fov={45}
      lazyLoad
      powerPreference="low-power"
    >
      <ShaderGradient
        animate={reduceMotion?'off':'on'}
        type="plane"
        shader="defaults"
        color1="#06142f"
        color2="#0b2b5a"
        color3="#ffd20a"
        brightness={1.05}
        uSpeed={0.12}
        uStrength={2.2}
        uDensity={1.1}
        uFrequency={3.8}
        cDistance={4.8}
        cPolarAngle={110}
        cAzimuthAngle={180}
        grain="on"
        grainBlending={0.08}
        enableTransition
      />
    </ShaderGradientCanvas>
    <div className="csp-ambient-scrim" />
  </div>;
}
