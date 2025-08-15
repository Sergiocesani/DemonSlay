// === Configuración del tablero ===
// Base correcta: /page/mini-juego.html -> ../DemonSlay/images/demonslayer/
const IMG_BASE = new URL("../images/demonslayer/", document.baseURI).href;

const personajes = [
  { name: "ninju",      img: new URL("ninjumemoria.jpg",     IMG_BASE).href, alt: "Ratones uzui" },
  { name: "daki",       img: new URL("dakimemoria.jpg",      IMG_BASE).href, alt: "Daki" },
  { name: "kokushibo",  img: new URL("kokushibomemoria.jpg", IMG_BASE).href, alt: "Kokushibo" },
  { name: "inosuke",    img: new URL("inosukememoria.jpg",   IMG_BASE).href, alt: "Inosuke Hashibira" },
  { name: "giyu",       img: new URL("tomiokamemoria.jpg",   IMG_BASE).href, alt: "Giyu Tomioka" },
  { name: "muzan",      img: new URL("muzanmemoria.jpg",     IMG_BASE).href, alt: "Muzan Kibutsuji" },
  { name: "rengoku",    img: new URL("rengokumemoria.jpg",   IMG_BASE).href, alt: "Kyojuro Rengoku" },
  { name: "obanai",     img: new URL("obanaimemoria.jpg",    IMG_BASE).href, alt: "Iguro Obanai" }
];

const grid      = document.getElementById("grid");
const timeEl    = document.getElementById("time");
const movesEl   = document.getElementById("moves");
const bestEl    = document.getElementById("best");
const resetBtn  = document.getElementById("reset");
const dlg       = document.getElementById("winDialog");
const finalTime = document.getElementById("finalTime");
const finalMoves= document.getElementById("finalMoves");
const playAgain = document.getElementById("playAgain");

// Estado del juego
let deck = [];    // mazo de cartas (pares)
let first = null; // primer carta seleccionada
let second = null;// segunda carta
let lockBoard = false;
let matches = 0;
let moves = 0;
let timerId = null;
let seconds = 0;
let started = false;

const formatTime = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2,"0");
  const r = (s % 60).toString().padStart(2,"0");
  return `${m}:${r}`;
};
const startTimer = () => {
  if (started) return;
  started = true;
  timerId = setInterval(() => {
    seconds++;
    timeEl.textContent = formatTime(seconds);
  }, 1000);
};
const stopTimer = () => { clearInterval(timerId); timerId = null; };

// Barajar (Fisher–Yates)
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Construye el mazo duplicando personajes
function buildDeck(){
  const base = personajes.slice(0, 8); // 8 pares = 16 cartas
  deck = shuffle([...base, ...base].map((p, idx) => ({
    id: idx + "_" + p.name,
    name: p.name,
    img: p.img,
    alt: p.alt
  })));
}

// Renderiza las cartas
function renderGrid(){
  grid.innerHTML = "";
  deck.forEach(card => {
    const el = document.createElement("button");
    el.className = "card";
    el.type = "button";
    el.setAttribute("aria-label", `Carta de ${card.alt}`);
    el.dataset.name = card.name;
    el.innerHTML = `
      <div class="card-inner">
        <div class="face front"><span class="mark">鬼</span></div>
        <div class="face back"><img src="${card.img}" alt="${card.alt}"></div>
      </div>
    `;
    // Fallback visual por si un archivo no existe
    const img = el.querySelector("img");
    img.onerror = () => { img.alt = "Imagen no encontrada"; img.style.objectFit = "contain"; img.style.background = "#111"; };
    grid.appendChild(el);
  });
}

// Resetea estado
function resetState(){
  first = null; second = null; lockBoard = false;
  matches = 0; moves = 0; seconds = 0; started = false;
  movesEl.textContent = "0";
  timeEl.textContent = "00:00";
}

// Mejor tiempo
function loadBest(){
  const best = localStorage.getItem("ds_memory_best");
  bestEl.textContent = best ? best : "—";
}
function maybeSaveBest(){
  const best = localStorage.getItem("ds_memory_best");
  if (!best || seconds < toSeconds(best)) {
    localStorage.setItem("ds_memory_best", formatTime(seconds));
    bestEl.textContent = formatTime(seconds);
  }
}
function toSeconds(mmss){
  const [m,s] = mmss.split(":").map(Number);
  return m*60 + s;
}

// Click en carta
function onCardClick(e){
  const card = e.target.closest(".card");
  if (!card || lockBoard || card.classList.contains("matched")) return;

  startTimer();

  if (first && card === first) return; // evitar doble click misma carta

  card.classList.add("is-flipped");

  if (!first){
    first = card;
    return;
  }

  // Segundo click
  second = card;
  moves++; movesEl.textContent = String(moves);

  const isMatch = first.dataset.name === second.dataset.name;
  if (isMatch){
    first.classList.add("matched", "locked");
    second.classList.add("matched", "locked");
    first = null; second = null;
    matches++;

    if (matches === deck.length / 2){
      stopTimer();
      finalTime.textContent = formatTime(seconds);
      finalMoves.textContent = String(moves);
      maybeSaveBest();
      setTimeout(() => dlg.showModal(), 400);
    }
  } else {
    lockBoard = true;
    setTimeout(() => {
      first.classList.remove("is-flipped");
      second.classList.remove("is-flipped");
      first = null; second = null; lockBoard = false;
    }, 700);
  }
}

// Reiniciar juego
function newGame(){
  stopTimer();
  resetState();
  buildDeck();
  renderGrid();
  loadBest();
}

// Eventos
grid.addEventListener("click", onCardClick);
resetBtn.addEventListener("click", newGame);
playAgain.addEventListener("click", () => { dlg.close(); newGame(); });

// Init
newGame();
