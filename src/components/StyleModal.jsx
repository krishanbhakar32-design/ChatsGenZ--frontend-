/**
 * StyleModal.jsx — ChatsGenZ
 * Uses CSS classes from public/colors.css, public/bubbles.css, public/fonts.css
 * NO inline Google Fonts injection — fonts already loaded in index.html
 */

import { useState } from 'react'

// ── ALL 24 THEMES ──────────────────────────────────────────────
export const THEMES = [
  { id:'Dark',         name:'Dark',         bg_header:'#111',                                         bg_chat:'#151515',    bg_log:'rgb(255,255,255,0.04)', text:'#fff',     accent:'#03add8',  default_color:'#666',    bg_image:'' },
  { id:'Arc',          name:'Arc',          bg_header:'linear-gradient(to top,#21252f,#2b3140)',      bg_chat:'#181a21',    bg_log:'rgba(84,96,121,0.2)',   text:'#fff',     accent:'#5774b7',  default_color:'#546079', bg_image:'/themes/Arc/background.png' },
  { id:'Purple',       name:'Purple',       bg_header:'#150442',                                      bg_chat:'#29165f',    bg_log:'rgba(36,15,94,0.7)',    text:'#fff',     accent:'#9773fb',  default_color:'#5027b9', bg_image:'/themes/Purple/decoration.png' },
  { id:'Dark Purple',  name:'Dark Purple',  bg_header:'#330738',                                      bg_chat:'#420a47',    bg_log:'#4e1254',               text:'#d7ced8',  accent:'#5f0f68',  default_color:'#581161', bg_image:'' },
  { id:'Blue',         name:'Blue',         bg_header:'#001e37',                                      bg_chat:'#013259',    bg_log:'rgba(0,83,151,0.5)',     text:'#fff',     accent:'#1e9aff',  default_color:'#005ca6', bg_image:'/themes/Blue/decoration.png' },
  { id:'Whatsapp',     name:'Whatsapp',     bg_header:'linear-gradient(#202c33,#0b141a)',             bg_chat:'#0b141a',    bg_log:'#005C4B',               text:'#e9edef',  accent:'#00a884',  default_color:'#aebac1', bg_image:'/themes/Whatsapp/chat_background.png' },
  { id:'Nord',         name:'Nord',         bg_header:'linear-gradient(#272833,#30343e)',             bg_chat:'transparent',bg_log:'rgba(66,71,85,0.8)',     text:'#fff',     accent:'#6e89c4',  default_color:'#585e6f', bg_image:'/themes/Nord/background.png' },
  { id:'Obsidian',     name:'Obsidian',     bg_header:'linear-gradient(#0d101e,#121425)',             bg_chat:'#0b0d18',    bg_log:'rgba(37,46,82,0.5)',     text:'#dae0fd',  accent:'#4a63cf',  default_color:'#3b4a88', bg_image:'/themes/Obsidian/background.svg' },
  { id:'Remix',        name:'Remix',        bg_header:'#011448',                                      bg_chat:'#0F1221',    bg_log:'rgba(39,66,147,0.5)',    text:'#fff',     accent:'#3b6cff',  default_color:'#274293', bg_image:'/themes/Remix/background.jpg' },
  { id:'Lite',         name:'Lite',         bg_header:'#222',                                         bg_chat:'#fff',       bg_log:'rgb(0,0,0,0.028)',       text:'#000',     accent:'#000',     default_color:'#03add8', bg_image:'' },
  { id:'Dolphin',      name:'Dolphin',      bg_header:'#edf1f4',                                      bg_chat:'#fff',       bg_log:'rgb(234,239,243,0.278)', text:'#333',     accent:'#ff5c00',  default_color:'#3781dc', bg_image:'' },
  { id:'Catween',      name:'Catween',      bg_header:'#260d01',                                      bg_chat:'#000',       bg_log:'rgb(83,51,32,0.6)',      text:'#fff',     accent:'#e24e03',  default_color:'#4a3a29', bg_image:'/themes/Catween/background.jpg' },
  { id:'CuteOwl',      name:'CuteOwl',      bg_header:'linear-gradient(rgba(32,20,14,0.85),#14120c)',bg_chat:'rgba(13,8,5,0.61)',bg_log:'rgba(77,71,45,0.4)',text:'#fff',   accent:'#d3b300',  default_color:'#6a6242', bg_image:'/themes/CuteOwl/background.jpg' },
  { id:'Explorer',     name:'Explorer',     bg_header:'linear-gradient(#210002,#752622)',             bg_chat:'#752622',    bg_log:'rgba(33,0,2,0.5)',       text:'#ffbba4',  accent:'#ff5b24',  default_color:'#ff7e51', bg_image:'/themes/Explorer/background.png' },
  { id:'Forest',       name:'Forest',       bg_header:'linear-gradient(rgba(17,17,17,0.62),rgba(17,17,17,0.73))', bg_chat:'transparent', bg_log:'rgba(85,71,53,0.6)', text:'#fff', accent:'#eeb266', default_color:'#88745b', bg_image:'/themes/Forest/background.jpg' },
  { id:'Halloween',    name:'Halloween',    bg_header:'linear-gradient(#000,#672e00)',                bg_chat:'#000',       bg_log:'rgba(135,61,0,0.4)',     text:'#fff',     accent:'#ff7607',  default_color:'#da7b2f', bg_image:'/themes/Halloween/background.jpg' },
  { id:'Jungle_Green', name:'Jungle Green', bg_header:'linear-gradient(#0c2d22,#18392e)',             bg_chat:'#18392e',    bg_log:'rgba(36,101,80,0.7)',    text:'#fff',     accent:'#33dda6',  default_color:'#70ccae', bg_image:'/themes/Jungle_Green/background.png' },
  { id:'Mauve_Purple', name:'Mauve Purple', bg_header:'linear-gradient(#120f37,#2a2660)',             bg_chat:'#2a2660',    bg_log:'#393386',               text:'#fff',     accent:'#7b76c8',  default_color:'#8b87d0', bg_image:'/themes/Mauve_Purple/background.png' },
  { id:'Scent',        name:'Scent',        bg_header:'linear-gradient(#591629,#ffe9ef)',             bg_chat:'#ffe9ef',    bg_log:'rgba(244,194,208,0.6)', text:'#6a3343',  accent:'#d94871',  default_color:'#591629', bg_image:'/themes/Scent/flower.png' },
  { id:'StPatrick',    name:'St. Patrick',  bg_header:'linear-gradient(#026500,#014100)',             bg_chat:'#012500',    bg_log:'rgba(3,116,0,0.5)',      text:'#fff',     accent:'#05b400',  default_color:'#058801', bg_image:'/themes/StPatrick/background.jpg' },
  { id:'Red_Leaves',   name:'Red Leaves',   bg_header:'linear-gradient(rgb(34,16,16,0.82),#111)',     bg_chat:'transparent',bg_log:'rgba(98,53,53,0.5)',     text:'#fff',     accent:'#bb5f5f',  default_color:'#884747', bg_image:'/themes/Red_Leaves/background.jpg' },
  { id:'Venetian_Red', name:'Venetian Red', bg_header:'linear-gradient(#2f1010,#391818)',             bg_chat:'#391818',    bg_log:'rgba(106,38,38,0.8)',    text:'#fff',     accent:'#df4444',  default_color:'#ce7272', bg_image:'/themes/Venetian_Red/background.png' },
  { id:'Light Blue',   name:'Light Blue',   bg_header:'#27323f',                                      bg_chat:'#1e242c',    bg_log:'#252d36',               text:'#fff',     accent:'#334961',  default_color:'#334257', bg_image:'' },
  { id:'Yankees_Blue', name:'Yankees Blue', bg_header:'linear-gradient(to right,#0b1228,#182039)',    bg_chat:'#182039',    bg_log:'#27386f',               text:'#fff',     accent:'#3774d8',  default_color:'#7096d5', bg_image:'/themes/Yankees_Blue/background.png' },
]

export const SOLID_COLORS = [
  '#ff3333','#ff6633','#ff9933','#ffcc33','#cccc00','#99cc00','#59b300','#829356',
  '#008000','#00e639','#00e673','#00e6ac','#00cccc','#03add8','#3366ff','#107896',
  '#004d99','#6633ff','#9933ff','#cc33ff','#ff33ff','#ff33cc','#ff3399','#ff3366',
  '#604439','#795548','#a97f70','#bc9b8f','#9E9E9E','#879fab','#698796','#495f69',
]

export const NAME_GRADIENTS = [
  'linear-gradient(to right,#40e0d0,#ff8c00,#ff0080)',
  'linear-gradient(to right,#11998e,#38ef7d)',
  'linear-gradient(to right,#fc466b,#3f5efb)',
  'linear-gradient(to right,#00f260,#0575e6)',
  'linear-gradient(to right,#fc4a1a,#f7b733)',
  'linear-gradient(to right,#22c1c3,#fdbb2d)',
  'linear-gradient(to right,#7f00ff,#e100ff)',
  'linear-gradient(to right,#ee0979,#ff6a00)',
  'linear-gradient(to right,#00c3ff,#ffff1c)',
  'linear-gradient(to right,#fc00ff,#00dbde)',
  'linear-gradient(to right,#833ab4,#fd1d1d,#fcb045)',
  'linear-gradient(to right,#bdc3c7,#2c3e50)',
  'linear-gradient(to right,#373B44,#4286f4)',
  'linear-gradient(to right,#FF0099,#493240)',
  'linear-gradient(to right,#f953c6,#b91d73)',
  'linear-gradient(to right,#dd3e54,#6be585)',
  'linear-gradient(to right,#8360c3,#2ebf91)',
  'linear-gradient(to right,#544a7d,#ffd452)',
  'linear-gradient(to right,#009FFF,#ec2F4B)',
  'linear-gradient(to right,#59C173,#a17fe0,#5D26C1)',
  'linear-gradient(to right,#a8c0ff,#3f2b96)',
  'linear-gradient(45deg,#FF0000 0%,#FFA600 50%,#ff0000 100%)',
  'linear-gradient(to right,#108dc7,#ef8e38)',
  'linear-gradient(to right,#FF0099,#0575E6)',
  'linear-gradient(to right,#667db6,#0082c8,#ec38bc,#fdeff9)',
  'linear-gradient(to right,#03001e,#7303c0,#ec38bc,#fdeff9)',
  'linear-gradient(to right,#1a2a6c,#b21f1f,#fdbb2d)',
  'linear-gradient(to right,#3A1C71,#D76D77,#FFAF7B)',
  'linear-gradient(to right,#EB5757,#333)',
  'linear-gradient(to right,#20002c,#cbb4d4)',
  'linear-gradient(to right,#34e89e,#0f3443)',
  'linear-gradient(to right,#bdc3c7,#2c3e50)',
  'linear-gradient(to right,#a80077,#66ff00)',
  'linear-gradient(to bottom,#6db3f2 0%,#54a3ee 50%,#3690f0 51%,#1e69de 100%)',
  'linear-gradient(to top,#a241b7,#7f68d7,#5186e9,#1b9eef,#12b2eb)',
  'linear-gradient(to bottom,#845EC2 0%,#D65DB1 0%,#FF6F91 51%,#FF9671 100%)',
  'linear-gradient(to right,#FF0000,#FFF200,#1E9600)',
  'linear-gradient(330deg,#e05252 0%,#99e052 25%,#52e0e0 50%,#9952e0 75%,#e05252 100%)',
  'linear-gradient(to bottom,#051937,#004d7a,#008793,#00bf72,#a8eb12)',
  'linear-gradient(45deg,#222 0%,#FFA600 50%,#222 100%)',
]

export const NEON_COLORS = [
  { color:'#ff3333', shadow:'1px 1px 1px #e60000,1px 1px 3px #ff3333,1px 1px 5px #ff3333' },
  { color:'#ff6633', shadow:'1px 1px 1px #e63900,1px 1px 3px #ff6633,1px 1px 5px #ff6633' },
  { color:'#ff9933', shadow:'1px 1px 1px #e67300,1px 1px 3px #ff9933,1px 1px 5px #ff9933' },
  { color:'#ffcc33', shadow:'1px 1px 1px #b38600,1px 1px 3px #ffcc33,1px 1px 5px #ffcc33' },
  { color:'#cccc00', shadow:'1px 1px 1px #808000,1px 1px 3px #cccc00,1px 1px 5px #cccc00' },
  { color:'#99cc00', shadow:'1px 1px 1px #739900,1px 1px 3px #99cc00,1px 1px 5px #99cc00' },
  { color:'#59b300', shadow:'1px 1px 1px #408000,1px 1px 3px #59b300,1px 1px 5px #59b300' },
  { color:'#829356', shadow:'1px 1px 1px #637042,1px 1px 3px #829356,1px 1px 5px #829356' },
  { color:'#008000', shadow:'1px 1px 1px #004d00,1px 1px 3px #008000,1px 1px 5px #008000' },
  { color:'#00e639', shadow:'1px 1px 1px #009926,1px 1px 3px #00e639,1px 1px 5px #00e639' },
  { color:'#00e673', shadow:'1px 1px 1px #00994d,1px 1px 3px #00e673,1px 1px 5px #00e673' },
  { color:'#00e6ac', shadow:'1px 1px 1px #009973,1px 1px 3px #00e6ac,1px 1px 5px #00e6ac' },
  { color:'#00cccc', shadow:'1px 1px 1px #008080,1px 1px 3px #00cccc,1px 1px 5px #00cccc' },
  { color:'#03add8', shadow:'1px 1px 1px #027997,1px 1px 3px #03add8,1px 1px 5px #03add8' },
  { color:'#3366ff', shadow:'1px 1px 1px #0040ff,1px 1px 3px #3366ff,1px 1px 5px #3366ff' },
  { color:'#107896', shadow:'1px 1px 1px #0c5d73,1px 1px 3px #107896,1px 1px 5px #107896' },
  { color:'#004d99', shadow:'1px 1px 1px #003366,1px 1px 3px #004d99,1px 1px 5px #004d99' },
  { color:'#6633ff', shadow:'1px 1px 1px #2d00b3,1px 1px 3px #6633ff,1px 1px 5px #6633ff' },
  { color:'#9933ff', shadow:'1px 1px 1px #7300e6,1px 1px 3px #9933ff,1px 1px 5px #9933ff' },
  { color:'#cc33ff', shadow:'1px 1px 1px #ac00e6,1px 1px 3px #cc33ff,1px 1px 5px #cc33ff' },
  { color:'#ff33ff', shadow:'1px 1px 1px #cc00cc,1px 1px 3px #ff33ff,1px 1px 5px #ff33ff' },
  { color:'#ff33cc', shadow:'1px 1px 1px #e600ac,1px 1px 3px #ff33cc,1px 1px 5px #ff33cc' },
  { color:'#ff3399', shadow:'1px 1px 1px #cc0066,1px 1px 3px #ff3399,1px 1px 5px #ff3399' },
  { color:'#ff3366', shadow:'1px 1px 1px #e60039,1px 1px 3px #ff3366,1px 1px 5px #ff3366' },
  { color:'#604439', shadow:'1px 1px 1px #503930,1px 1px 3px #604439,1px 1px 5px #604439' },
  { color:'#795548', shadow:'1px 1px 1px #604439,1px 1px 3px #795548,1px 1px 5px #795548' },
  { color:'#a97f70', shadow:'1px 1px 1px #805a4d,1px 1px 3px #a97f70,1px 1px 5px #a97f70' },
  { color:'#bc9b8f', shadow:'1px 1px 1px #9f7160,1px 1px 3px #bc9b8f,1px 1px 5px #bc9b8f' },
  { color:'#9E9E9E', shadow:'1px 1px 1px #808080,1px 1px 3px #9E9E9E,1px 1px 5px #9E9E9E' },
  { color:'#879fab', shadow:'1px 1px 1px #5e7a87,1px 1px 3px #879fab,1px 1px 5px #879fab' },
  { color:'#698796', shadow:'1px 1px 1px #495f69,1px 1px 3px #698796,1px 1px 5px #698796' },
  { color:'#495f69', shadow:'1px 1px 1px #2a363c,1px 1px 3px #495f69,1px 1px 5px #495f69' },
]

export const BUBBLE_GRADIENTS = [
  'linear-gradient(90deg,#667eea,#764ba2)','linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#4facfe,#00f2fe)','linear-gradient(90deg,#43e97b,#38f9d7)',
  'linear-gradient(90deg,#fa709a,#fee140)','linear-gradient(90deg,#ff9a56,#ff6b9d)',
  'linear-gradient(90deg,#c471f5,#fa71cd)','linear-gradient(90deg,#12c2e9,#c471ed)',
  'linear-gradient(90deg,#f64f59,#c471ed)','linear-gradient(90deg,#24fe41,#fdbb2d)',
  'linear-gradient(45deg,#ff0844,#ffb199)','linear-gradient(45deg,#00d2ff,#3a7bd5)',
  'linear-gradient(45deg,#f953c6,#b91d73)','linear-gradient(45deg,#36d1dc,#5b86e5)',
  'linear-gradient(45deg,#ff9068,#fd746c)','linear-gradient(45deg,#667eea,#764ba2)',
  'linear-gradient(45deg,#f093fb,#f5576c)','linear-gradient(45deg,#4facfe,#00f2fe)',
  'linear-gradient(45deg,#43e97b,#38f9d7)','linear-gradient(45deg,#fa709a,#fee140)',
  'linear-gradient(90deg,#ff5f6d,#ffc371)','linear-gradient(90deg,#36d1dc,#ff6b6b)',
  'linear-gradient(90deg,#11998e,#38ef7d)','linear-gradient(90deg,#ee0979,#ff6a00)',
  'linear-gradient(90deg,#fc5c7d,#6a82fb)','linear-gradient(90deg,#8360c3,#2ebf91)',
  'linear-gradient(90deg,#ff9966,#ff5e62)','linear-gradient(90deg,#56ccf2,#2f80ed)',
  'linear-gradient(90deg,#e96443,#904e95)','linear-gradient(90deg,#f7971e,#ffd200)',
  'linear-gradient(45deg,#00c6ff,#0072ff)','linear-gradient(45deg,#7f00ff,#e100ff)',
  'linear-gradient(45deg,#ff416c,#ff4b2b)','linear-gradient(45deg,#00b09b,#96c93d)',
  'linear-gradient(45deg,#ff6a00,#ee0979)','linear-gradient(45deg,#43cea2,#185a9d)',
  'linear-gradient(45deg,#c33764,#1d2671)','linear-gradient(45deg,#da4453,#89216b)',
  'linear-gradient(45deg,#06beb6,#48b1bf)','linear-gradient(45deg,#f12711,#f5af19)',
]

export const BUBBLE_NEONS = BUBBLE_GRADIENTS.map((g, i) => {
  const glows = ['#a18cff','#ffb6ff','#7eefff','#8cffd9','#ffd580','#ffb38c','#e3b0ff','#9fe2ff','#ff99d9','#d2ff9c','#ff7ab3','#66e0ff','#ff88f5','#80e0ff','#ffb199','#a18cff','#ffb6ff','#7eefff','#8cffd9','#ffd580','#ffd1a3','#9ff5f0','#77ffbf','#ff85b3','#c9a9ff','#9bf6d5','#ffb199','#9fd4ff','#f7a0c2','#ffe680','#66d6ff','#d780ff','#ff9a80','#a8ff9f','#ff9abb','#7be2ff','#e06699','#ff8ca6','#7dfcff','#ffb866']
  return { gradient: g, glow: glows[i] || '#ffffff44' }
})

export const FONTS = [
  { id:'font1',  name:'Kalam',            family:"'Kalam', cursive" },
  { id:'font2',  name:'Signika',          family:"'Signika', sans-serif" },
  { id:'font3',  name:'Grandstander',     family:"'Grandstander', cursive" },
  { id:'font4',  name:'Comic Neue',       family:"'Comic Neue', cursive" },
  { id:'font5',  name:'Quicksand',        family:"'Quicksand', sans-serif" },
  { id:'font6',  name:'Orbitron',         family:"'Orbitron', sans-serif" },
  { id:'font7',  name:'Lemonada',         family:"'Lemonada', cursive" },
  { id:'font8',  name:'Grenze Gotisch',   family:"'Grenze Gotisch', cursive" },
  { id:'font9',  name:'Merienda',         family:"'Merienda', cursive" },
  { id:'font10', name:'Amita',            family:"'Amita', cursive" },
  { id:'font11', name:'Averia Libre',     family:"'Averia Libre', cursive" },
  { id:'font12', name:'Turret Road',      family:"'Turret Road', cursive" },
  { id:'font13', name:'Sansita',          family:"'Sansita', sans-serif" },
  { id:'font14', name:'Comfortaa',        family:"'Comfortaa', cursive" },
  { id:'font15', name:'Charm',            family:"'Charm', cursive" },
  { id:'font16', name:'Lobster Two',      family:"'Lobster Two', cursive" },
  { id:'font17', name:'Pacifico',         family:"'Pacifico', cursive" },
  { id:'font18', name:'Dancing Script',   family:"'Dancing Script', cursive" },
  { id:'font19', name:'Righteous',        family:"'Righteous', cursive" },
  { id:'font20', name:'Fredoka One',      family:"'Fredoka One', cursive" },
  { id:'font21', name:'Press Start 2P',   family:"'Press Start 2P', cursive" },
  { id:'font22', name:'Caveat',           family:"'Caveat', cursive" },
  { id:'font23', name:'Satisfy',          family:"'Satisfy', cursive" },
  { id:'font24', name:'Indie Flower',     family:"'Indie Flower', cursive" },
  { id:'font25', name:'Gloria Hallelujah',family:"'Gloria Hallelujah', cursive" },
  { id:'font26', name:'Exo 2',            family:"'Exo 2', sans-serif" },
  { id:'font27', name:'Rajdhani',         family:"'Rajdhani', sans-serif" },
  { id:'font28', name:'Josefin Sans',     family:"'Josefin Sans', sans-serif" },
  { id:'font29', name:'Audiowide',        family:"'Audiowide', sans-serif" },
  { id:'font30', name:'Nunito',           family:"'Nunito', sans-serif" },
]

const FONT_STYLES = [
  { id:'normal',      name:'Normal' },
  { id:'bold',        name:'Bold' },
  { id:'italic',      name:'Italic' },
  { id:'bold italic', name:'Bold Italic' },
]

export function getNameStyle(nameColor) {
  if (!nameColor || nameColor === 'user') return {}
  const idx = parseInt(nameColor.replace('bcolor','')) - 1
  if (nameColor.startsWith('bcolor') && SOLID_COLORS[idx]) return { color: SOLID_COLORS[idx] }
  const gidx = parseInt(nameColor.replace('bgrad','')) - 1
  if (nameColor.startsWith('bgrad') && NAME_GRADIENTS[gidx]) return { background: NAME_GRADIENTS[gidx], WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }
  const nidx = parseInt(nameColor.replace('bneon','')) - 1
  if (nameColor.startsWith('bneon') && NEON_COLORS[nidx]) return { color:'#fff', textShadow: NEON_COLORS[nidx].shadow }
  return {}
}

export function getBubbleStyle(bubbleColor) {
  if (!bubbleColor) return {}
  const idx = parseInt(bubbleColor.replace('bubcolor','')) - 1
  if (bubbleColor.startsWith('bubcolor') && SOLID_COLORS[idx]) return { background: SOLID_COLORS[idx], color:'#fff', textShadow:'0 0 3px rgba(0,0,0,.5)' }
  const gidx = parseInt(bubbleColor.replace('bubgrad','')) - 1
  if (bubbleColor.startsWith('bubgrad') && BUBBLE_GRADIENTS[gidx]) return { background: BUBBLE_GRADIENTS[gidx], color:'#fff', textShadow:'0 0 3px rgba(0,0,0,.5)' }
  const nidx = parseInt(bubbleColor.replace('bubneon','')) - 1
  if (bubbleColor.startsWith('bubneon') && BUBBLE_NEONS[nidx]) return { background: BUBBLE_NEONS[nidx].gradient, boxShadow:`0 0 8px ${BUBBLE_NEONS[nidx].glow}`, color:'#fff', textShadow:'0 0 3px rgba(0,0,0,.5)' }
  return {}
}

export default function StyleModal({ type, user, settings, onSave, onClose }) {
  const [tab, setTab]               = useState('solid')
  const [selected, setSelected]     = useState('')
  const [selFont, setSelFont]       = useState(user?.msgFont || '')
  const [selNameFont, setSelNameFont] = useState(user?.nameFont || '')
  const [fontStyle, setFontStyle]   = useState(user?.bubbleStyle || 'normal')
  const [msgColor, setMsgColor]     = useState(user?.msgFontColor || '#ffffff')
  const [selTheme, setSelTheme]     = useState(user?.theme || 'Dark')
  const [saving, setSaving]         = useState(false)

  const canGrad     = !!settings?.allow_grad
  const canNeon     = !!settings?.allow_neon
  const canNameGrad = !!settings?.allow_name_grad
  const canNameNeon = !!settings?.allow_name_neon

  const previewNameStyle = type === 'nameColor' ? (
    tab === 'solid'    ? { color: SOLID_COLORS[parseInt(selected.replace('bcolor',''))-1] || '#333' } :
    tab === 'gradient' ? { background: NAME_GRADIENTS[parseInt(selected.replace('bgrad',''))-1], WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' } :
    tab === 'neon'     ? { color:'#fff', textShadow: NEON_COLORS[parseInt(selected.replace('bneon',''))-1]?.shadow, background:'#111', padding:'2px 8px', borderRadius:4 } : {}
  ) : {}

  const previewBubbleStyle = type === 'bubbleColor' ? (
    tab === 'solid'    ? { background: SOLID_COLORS[parseInt(selected.replace('bubcolor',''))-1] || '#374151', color:'#fff' } :
    tab === 'gradient' ? { background: BUBBLE_GRADIENTS[parseInt(selected.replace('bubgrad',''))-1], color:'#fff' } :
    tab === 'neon'     ? { background: BUBBLE_NEONS[parseInt(selected.replace('bubneon',''))-1]?.gradient, boxShadow:`0 0 10px ${BUBBLE_NEONS[parseInt(selected.replace('bubneon',''))-1]?.glow}`, color:'#fff' } : {}
  ) : {}

  const selThemeObj = THEMES.find(t=>t.id===selTheme) || THEMES[0]

  async function save() {
    setSaving(true)
    try {
      if (type === 'nameColor') {
        await onSave([
          { field:'nameColor', value: selected || 'user' },
          { field:'nameFont',  value: selNameFont },
        ])
      } else if (type === 'bubbleColor') {
        await onSave([
          { field:'bubbleColor',  value: selected },
          { field:'bubbleStyle',  value: fontStyle },
          { field:'msgFont',      value: selFont },
          { field:'msgFontColor', value: msgColor },
        ])
      } else if (type === 'theme') {
        await onSave([{ field:'theme', value: selTheme }])
      }
      onClose()
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const SW = { width:32, height:32, borderRadius:6, cursor:'pointer', border:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .1s,border-color .1s', flexShrink:0 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#1a1d2e', border:'1px solid #2a2d3e', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px #000a' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #2a2d3e' }}>
          <div style={{ fontWeight:900, fontSize:15, color:'#f1f5f9' }}>
            {type==='nameColor'   && '🎨 Username Color & Font'}
            {type==='bubbleColor' && '💬 Chat Bubble Style'}
            {type==='theme'       && '🎨 Chat Theme'}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:20 }}>

          {/* ── NAME COLOR ── */}
          {type === 'nameColor' && <>
            <div style={{ background:'#0d1020', borderRadius:10, padding:'14px 16px', marginBottom:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Preview</div>
              <span style={{ fontSize:18, fontWeight:800, fontFamily: FONTS.find(f=>f.id===selNameFont)?.family || 'inherit', ...previewNameStyle }}>
                {user?.username || 'YourName'}
              </span>
            </div>

            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {[['solid','🎨 Solid'],['gradient','🌈 Gradient'],['neon','✨ Neon']]
                .filter(([id]) => id==='solid'||(id==='gradient'&&canNameGrad)||(id==='neon'&&canNameNeon))
                .map(([id,label]) => (
                  <button key={id} onClick={()=>setTab(id)}
                    style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${tab===id?'#3b82f6':'#2a2d3e'}`, background:tab===id?'#1e3a5f':'transparent', color:tab===id?'#60a5fa':'#6b7280', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    {label}
                  </button>
                ))}
            </div>

            {tab==='solid' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                <div onClick={()=>setSelected('')} style={{ ...SW, background:'#374151', border:`2px solid ${selected===''?'#3b82f6':'#555'}` }}>
                  {selected==='' && <span style={{ fontSize:14, color:'#fff' }}>✓</span>}
                </div>
                {SOLID_COLORS.map((c,i) => (
                  <div key={i} onClick={()=>setSelected(`bcolor${i+1}`)}
                    style={{ ...SW, background:c, border:`2px solid ${selected===`bcolor${i+1}`?'#fff':'transparent'}`, transform:selected===`bcolor${i+1}`?'scale(1.15)':'scale(1)' }}>
                    {selected===`bcolor${i+1}` && <span style={{ color:'#fff', fontSize:12, textShadow:'0 1px 2px #000' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {tab==='gradient' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                {NAME_GRADIENTS.map((g,i) => (
                  <div key={i} onClick={()=>setSelected(`bgrad${i+1}`)}
                    style={{ ...SW, background:g, border:`2px solid ${selected===`bgrad${i+1}`?'#fff':'transparent'}`, transform:selected===`bgrad${i+1}`?'scale(1.15)':'scale(1)' }}>
                    {selected===`bgrad${i+1}` && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {tab==='neon' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                {NEON_COLORS.map((n,i) => (
                  <div key={i} onClick={()=>setSelected(`bneon${i+1}`)}
                    style={{ ...SW, background:n.color, border:`2px solid ${selected===`bneon${i+1}`?'#fff':'#333'}`, boxShadow:`0 0 6px ${n.color}`, transform:selected===`bneon${i+1}`?'scale(1.15)':'scale(1)' }}>
                    {selected===`bneon${i+1}` && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:8, fontWeight:700, textTransform:'uppercase' }}>Username Font</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                <div onClick={()=>setSelNameFont('')}
                  style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${selNameFont===''?'#3b82f6':'#2a2d3e'}`, background:selNameFont===''?'#1e3a5f':'transparent', cursor:'pointer', textAlign:'center', fontSize:13, color:selNameFont===''?'#60a5fa':'#9ca3af' }}>
                  Default
                </div>
                {FONTS.slice(0,16).map(f => (
                  <div key={f.id} onClick={()=>setSelNameFont(f.id)}
                    style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${selNameFont===f.id?'#3b82f6':'#2a2d3e'}`, background:selNameFont===f.id?'#1e3a5f':'transparent', cursor:'pointer', textAlign:'center', fontSize:13, fontFamily:f.family, color:selNameFont===f.id?'#60a5fa':'#d1d5db', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ── BUBBLE COLOR ── */}
          {type === 'bubbleColor' && <>
            <div style={{ background:'#0d1020', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Preview</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#2a2d3e', flexShrink:0 }}/>
                <div style={{ padding:'8px 12px', borderRadius:'3px 13px 13px 13px', fontSize:13, fontWeight:fontStyle.includes('bold')?700:400, fontStyle:fontStyle.includes('italic')?'italic':'normal', fontFamily:FONTS.find(f=>f.id===selFont)?.family||'inherit', color:msgColor||'#fff', ...previewBubbleStyle, maxWidth:200 }}>
                  Hey! This is how your messages will look 😊
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {[['solid','🎨 Solid'],['gradient','🌈 Gradient'],['neon','✨ Neon']]
                .filter(([id]) => id==='solid'||(id==='gradient'&&canGrad)||(id==='neon'&&canNeon))
                .map(([id,label]) => (
                  <button key={id} onClick={()=>setTab(id)}
                    style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${tab===id?'#3b82f6':'#2a2d3e'}`, background:tab===id?'#1e3a5f':'transparent', color:tab===id?'#60a5fa':'#6b7280', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    {label}
                  </button>
                ))}
            </div>

            {tab==='solid' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                <div onClick={()=>setSelected('')} style={{ ...SW, background:'#374151', border:`2px solid ${selected===''?'#3b82f6':'#555'}` }}>
                  {selected==='' && <span style={{ fontSize:10, color:'#9ca3af' }}>def</span>}
                </div>
                {SOLID_COLORS.map((c,i) => (
                  <div key={i} onClick={()=>setSelected(`bubcolor${i+1}`)}
                    style={{ ...SW, background:c, border:`2px solid ${selected===`bubcolor${i+1}`?'#fff':'transparent'}`, transform:selected===`bubcolor${i+1}`?'scale(1.15)':'scale(1)' }}>
                    {selected===`bubcolor${i+1}` && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {tab==='gradient' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                {BUBBLE_GRADIENTS.map((g,i) => (
                  <div key={i} onClick={()=>setSelected(`bubgrad${i+1}`)}
                    style={{ ...SW, background:g, border:`2px solid ${selected===`bubgrad${i+1}`?'#fff':'transparent'}`, transform:selected===`bubgrad${i+1}`?'scale(1.15)':'scale(1)' }}>
                    {selected===`bubgrad${i+1}` && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {tab==='neon' && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                {BUBBLE_NEONS.map((n,i) => (
                  <div key={i} onClick={()=>setSelected(`bubneon${i+1}`)}
                    style={{ ...SW, background:n.gradient, boxShadow:`0 0 6px ${n.glow}`, border:`2px solid ${selected===`bubneon${i+1}`?'#fff':'transparent'}`, transform:selected===`bubneon${i+1}`?'scale(1.15)':'scale(1)' }}>
                    {selected===`bubneon${i+1}` && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
              <div>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:6, fontWeight:700, textTransform:'uppercase' }}>Text Style</div>
                {FONT_STYLES.map(fs => (
                  <div key={fs.id} onClick={()=>setFontStyle(fs.id)}
                    style={{ padding:'6px 10px', borderRadius:7, border:`1px solid ${fontStyle===fs.id?'#3b82f6':'#2a2d3e'}`, background:fontStyle===fs.id?'#1e3a5f':'transparent', cursor:'pointer', marginBottom:5, fontSize:13, fontWeight:fs.id.includes('bold')?700:400, fontStyle:fs.id.includes('italic')?'italic':'normal', color:fontStyle===fs.id?'#60a5fa':'#9ca3af' }}>
                    {fs.name}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:6, fontWeight:700, textTransform:'uppercase' }}>Text Color</div>
                <input type="color" value={msgColor} onChange={e=>setMsgColor(e.target.value)}
                  style={{ width:'100%', height:40, borderRadius:8, border:'1px solid #2a2d3e', cursor:'pointer', background:'transparent', marginBottom:8 }}/>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:6, fontWeight:700, textTransform:'uppercase' }}>Bubble Font</div>
                <select value={selFont} onChange={e=>setSelFont(e.target.value)}
                  style={{ width:'100%', background:'#0d1020', border:'1px solid #2a2d3e', borderRadius:7, padding:'7px 8px', color:'#f1f5f9', fontSize:12, cursor:'pointer' }}>
                  <option value="">Default</option>
                  {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          </>}

          {/* ── THEME ── */}
          {type === 'theme' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
              {THEMES.map(t => (
                <div key={t.id} onClick={()=>setSelTheme(t.id)}
                  style={{ borderRadius:10, overflow:'hidden', border:`2px solid ${selTheme===t.id?'#3b82f6':'#2a2d3e'}`, cursor:'pointer', transition:'border-color .15s', transform:selTheme===t.id?'scale(1.02)':'scale(1)' }}>
                  <div style={{ background:t.bg_header, padding:'6px 10px', display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,255,255,.3)' }}/>
                    <span style={{ fontSize:10, color:t.text||'#fff', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</span>
                    {selTheme===t.id && <span style={{ marginLeft:'auto', fontSize:10, color:'#60a5fa' }}>✓</span>}
                  </div>
                  <div style={{ background:t.bg_chat, padding:'8px 10px', minHeight:52 }}>
                    <div style={{ background:t.bg_log, borderRadius:6, padding:'4px 8px', display:'inline-block', maxWidth:'80%' }}>
                      <span style={{ fontSize:10, color:t.text }}>Hello! 👋</span>
                    </div>
                  </div>
                  <div style={{ background:t.default_color, padding:'4px 8px', display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ flex:1, background:'rgba(255,255,255,.1)', borderRadius:4, height:16 }}/>
                    <div style={{ width:20, height:16, borderRadius:4, background:t.accent }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid #2a2d3e' }}>
              <div style={{ background:selThemeObj.bg_header, padding:'10px 14px' }}>
                <span style={{ color:selThemeObj.text, fontWeight:700, fontSize:13 }}>#{selThemeObj.name}</span>
              </div>
              <div style={{ background:selThemeObj.bg_chat, padding:'12px 14px', minHeight:80 }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:selThemeObj.accent, flexShrink:0 }}/>
                  <div style={{ background:selThemeObj.bg_log, padding:'6px 10px', borderRadius:'3px 10px 10px 10px' }}>
                    <span style={{ color:selThemeObj.text, fontSize:12 }}>This is how chat looks! 🎉</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end', justifyContent:'flex-end' }}>
                  <div style={{ background:selThemeObj.accent, padding:'6px 10px', borderRadius:'10px 3px 10px 10px' }}>
                    <span style={{ color:'#fff', fontSize:12 }}>Looks awesome 🔥</span>
                  </div>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:selThemeObj.default_color, flexShrink:0 }}/>
                </div>
              </div>
            </div>
          </>}
        </div>

        <div style={{ padding:'14px 20px', borderTop:'1px solid #2a2d3e', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid #2a2d3e', background:'transparent', color:'#9ca3af', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff', fontWeight:800, fontSize:13, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', opacity:saving?0.7:1 }}>
            {saving ? '💾 Saving...' : '💾 Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
