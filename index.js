const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (preferDark) {
  document.body.className = "nightmode";
}
const subtitle = document.getElementById("subtitle");
const row = document.getElementById("word");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const reveal = document.getElementById("reveal");
const get = document.getElementById("get");
const date = document.getElementById("date");
const start = new Date(2021, 5, 19, 0, 0, 0, 0);
const today = new Date();
const diff = today.getTime() - start.getTime();
const days = Math.ceil(diff / (1000 * 3600 * 24)) - 1;
let filters;
let wordIndex = days;
let word = words[wordIndex];
const numberOfGuesses = 6;
const numberOfLetters = 5;
reveal.addEventListener("click", () => {
  populateWord(word);
});

prev.addEventListener("click", () => {
  setWord(wordIndex - 1);
  updateFilters();
});

next.addEventListener("click", () => {
  setWord(wordIndex + 1);
  updateFilters();
});

const letters = [];
const inputLetters = [];
const possibleLetters = [];
let selectedInput;
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

for (let i = 0; i < numberOfGuesses; i++) {
  for (j in word) {
    const l = document.createElement("div");
    l.className = "tile";

    l.addEventListener("click", async () => {
      selectedInput.classList.remove("selected");
      l.classList.add("selected");
      selectedInput = l;
    });
    document.getElementById("input").appendChild(l);

    inputLetters.push(l);
  }
}

get.addEventListener("click", getWords);

document.addEventListener("keydown", async (e) => {
  const key = e.key.toLowerCase();
  const isLetter = key >= "a" && key <= "z" && key.length === 1;
  let nextSelectedInput;
  if (isLetter) {
    if (selectedInput) {
      const i = inputLetters.indexOf(selectedInput);
      selectedInput.textContent = key;
      animate(selectedInput, "pop", "tbd");
      if (i < inputLetters.length - 1) {
        nextSelectedInput = inputLetters[i + 1];
      }
    } else {
      inputLetters[0].textContent = key;
      animate(selectedInput, "pop", "tbd");
      nextSelectedInput = inputLetters[1];
    }
  }
  if (key === "backspace") {
    if (selectedInput) {
      if (selectedInput.textContent !== "") {
        const i = inputLetters.indexOf(selectedInput);
        selectedInput.textContent = "";
        animate(selectedInput, "pop", "empty");
        nextSelectedInput = inputLetters[i - 1];
      } else {
        const i = inputLetters.indexOf(selectedInput);
        nextSelectedInput = inputLetters[i - 1];
        if (nextSelectedInput) {
          nextSelectedInput.textContent = "";
          animate(nextSelectedInput, "pop", "empty");
        }
      }
    } else {
      const i = inputLetters.findIndex((l) => l.textContent === "");
      nextSelectedInput = inputLetters[i - 1];
      if (nextSelectedInput) {
        nextSelectedInput.textContent = "";
        animate(nextSelectedInput, "pop", "empty");
      }
    }
    if (nextSelectedInput) {
      selectedInput.classList.remove("selected");
      selectedInput = nextSelectedInput;
      nextSelectedInput.classList.add("selected");
    }
  }

  if (nextSelectedInput) {
    selectedInput.classList.remove("selected");
    selectedInput = nextSelectedInput;
    nextSelectedInput.classList.add("selected");
  }
  if (key === "enter") {
    getWords();
  }
});
setWord(wordIndex);
restoreState();

async function getWords() {
  await updateLetterContent();
  const filters = updateFilters();
  document.getElementById("possible").innerHTML = "";
  const possible = words.filter((w) => {
    for (const filter of filters) {
      for (letter of filter) {
        if (letter) {
          if (letter.state === "correct" && w[letter.index] !== letter.letter) {
            return false;
          }
          if (
            letter.state === "present" &&
            getOccurrence(word, letter.letter) > getOccurrence(w, letter.letter)
          ) {
            return false;
          }
          if (
            letter.state === "absent" &&
            getOccurrence(word, letter.letter) < getOccurrence(w, letter.letter)
          ) {
            return false;
          }
        }
      }
    }

    return true;
  });
  for (poss of possible) {
    for (p of poss) {
      const l = document.createElement("div");
      l.className = "tile";
      l.textContent = p;
      l.setAttribute("data-state", "tbd");
      document.getElementById("possible").appendChild(l);

      possibleLetters.push(l);
    }
  }
}

async function updateLetterContent() {
  for (let i = 0; i < numberOfGuesses; i++) {
    let wordSoFar = "";
    let correct = 0;
    for (let j = 0; j < numberOfLetters; j++) {
      const l = inputLetters[numberOfLetters * i + j];
      if (l.textContent !== "" && l.getAttribute("data-state") === "tbd") {
        const key = l.textContent;
        wordSoFar += key;
        await animate(l, "flip-in");
        if (word[j] === key) {
          animate(l, "flip-out", "correct");
          correct++;
        } else if (
          word.includes(key) &&
          getOccurrence(word, key) >= getOccurrence(wordSoFar, key)
        ) {
          animate(l, "flip-out", "present");
        } else {
          animate(l, "flip-out", "absent");
        }
      }
    }
  }
}

function restoreState() {
  filters = JSON.parse(localStorage.getItem("filters")) || [];
  for (let i = 0; i < numberOfGuesses; i++) {
    for (let j = 0; j < numberOfLetters; j++) {
      const l = inputLetters[j + numberOfLetters * i];
      if (!filters[i]) {
        filters.push([]);
      }
      const current = filters[i][j];
      if (current) {
        l.textContent = current.letter;
        l.setAttribute("data-state", current.state);
      }
    }
  }
  const i =
    inputLetters.findIndex((l) => l.textContent === "") ||
    inputLetters.length - 1;
  selectedInput = inputLetters[i];
  selectedInput.classList.add("selected");
}

function updateFilters() {
  for (let i = 0; i < numberOfGuesses; i++) {
    for (let j = 0; j < numberOfLetters; j++) {
      const letter = inputLetters[j + numberOfLetters * i];
      if (letter.textContent != "") {
        filters[i][j] = {
          index: j,
          letter: letter.textContent,
          state: letter.getAttribute("data-state"),
        };
      } else {
        filters[i][j] = null;
      }
    }
  }
  localStorage.setItem("filters", JSON.stringify(filters));
  return filters;
}

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
    l.textContent = "";
  }
  for (l of inputLetters) {
    animate(l, "pop", "empty");
    l.textContent = "";
  }
  document.getElementById("possible").innerHTML = "";
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
    await animate(l, "flip-in");
    animate(l, "flip-out", "correct");
    l.textContent = word[letters.indexOf(l)];
  }
}

function animate(elem, animation, state, className) {
  return new Promise((resolve) => {
    function handleAnimationEnd() {
      elem.setAttribute("data-animation", "idle");
      elem.classList.remove(className);
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

function getOccurrence(word, letter) {
  return Array.from(word).filter((v) => v === letter).length;
}
function shuffle(array) {
  const shuffled = [...array];
  let currentIndex = shuffled.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}
