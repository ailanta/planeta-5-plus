/// <reference types="vite/client" />
const scenes: Record<string, {file:string;position:number}> = {
  atelier:{file:'gallery-editorial-v2.png',position:0},
  market:{file:'gallery-editorial-v2.png',position:50},
  home:{file:'gallery-editorial-v2.png',position:100},
  cafe:{file:'gallery-extension-v1.png',position:0},
  travel:{file:'gallery-extension-v1.png',position:100/3},
  care:{file:'gallery-extension-v1.png',position:200/3},
  tech:{file:'gallery-extension-v1.png',position:100},
}
export function sceneStyle(shopId:string) {
  const scene=scenes[shopId]||scenes.atelier
  return {backgroundImage:`url("${import.meta.env.BASE_URL}assets/${scene.file}")`,backgroundPosition:`${scene.position}% center`}
}
