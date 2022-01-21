const subtitle = document.getElementById("subtitle");
const row = document.getElementById("word");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const reveal = document.getElementById("reveal");
const date = document.getElementById("date");

const start = new Date(2021, 5, 19, 0, 0, 0, 0);
const today = new Date();
const diff = today.getTime() - start.getTime();
const days = Math.ceil(diff / (1000 * 3600 * 24)) - 1;

let wordIndex = 0;
let word = words[wordIndex];

reveal.addEventListener("click", () => {
  populateWord(word);
});

prev.addEventListener("click", () => {
  setWord(wordIndex - 1);
});

next.addEventListener("click", () => {
  setWord(wordIndex + 1);
});

const letters = [];
for (letter of word) {
  const l = document.createElement("div");
  l.className = "tile";
  l.addEventListener("mouseover", () => {
    if (l.getAttribute("data-state") === "empty") {
      l.textContent = "?";
    }
  });
  l.addEventListener("mouseout", () => {
    if (l.getAttribute("data-state") === "empty") {
      l.textContent = "";
    }
  });
  l.addEventListener("click", () => {
    if (l.getAttribute("data-state") === "empty") {
      l.textContent = "";
      populateLetter(l);
    }
  });
  row.appendChild(l);
  letters.push(l);
}
setWord(wordIndex);

function setWord(newWordIndex) {
  wordIndex = newWordIndex;
  if (wordIndex >= days) {
    next.title = "No peaking at tomorrow";
    next.disabled = true;
  } else {
    next.title = "";
    next.disabled = false;
  }

  if (wordIndex === 0) {
    prev.disabled = true;
  } else {
    prev.disabled = false;
  }
  word = words[wordIndex];
  clearLetters();
  subtitle.textContent = `Wordle ${wordIndex}`;
  const d = addDays(start, wordIndex);
  date.textContent = new Intl.DateTimeFormat("sv-SE").format(d);
}

function clearLetters() {
  for (l of letters) {
    animate(l, "pop", "empty");
    l.classList.remove("win");
    l.textContent = "";
  }
}

async function populateWord(w) {
  for (l of letters) {
    await populateLetter(l);
  }
  for (l of letters) {
    animate(l, "idle", undefined, "win");
  }
}

async function populateLetter(l) {
  if (l.getAttribute("data-state") !== "correct") {
    l.textContent = "";
    await animate(l, "flip-in", "absent");
    await animate(l, "flip-out", "correct");
    l.textContent = word[letters.indexOf(l)];
  }
}

function animate(elem, animation, state, className) {
  return new Promise((resolve) => {
    function handleAnimationEnd() {
      resolve(elem);
    }
    elem.addEventListener("animationend", handleAnimationEnd, { once: true });
    if (animation) {
      elem.setAttribute("data-animation", animation);
    }
    if (state) {
      elem.setAttribute("data-state", state);
    }
    if (className) {
      elem.classList.add(className);
    }
  });
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (preferDark) {
  document.body.className = "nightmode";
}
