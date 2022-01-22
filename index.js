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
let wordIndex = days - 2;
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
const a = {
  boardState: ["ouija", "hello", "", "", "", ""],
  evaluations: [
    ["absent", "absent", "present", "absent", "absent"],
    ["absent", "present", "absent", "absent", "absent"],
    null,
    null,
    null,
    null,
  ],
  rowIndex: 2,
  solution: "wince",
  gameStatus: "IN_PROGRESS",
  lastPlayedTs: 1642852867837,
  lastCompletedTs: null,
  restoringFromLocalStorage: null,
  hardMode: false,
};
const letters = [];
const inputLetters = [];
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

for (let i = 0; i < 5; i++) {
  for (j in word) {
    const l = document.createElement("div");
    l.className = "tile";

    l.addEventListener("click", async () => {
      selectedInput = l;
    });
    document.getElementById("input").appendChild(l);

    inputLetters.push(l);
    selectedInput = inputLetters[0];
  }
}

get.addEventListener("click", () => {
  const filters = updateFilters();
  console.log(
    filters,
    words.filter((word) => {
      for (const filter of filters) {
        for (letter of filter) {
          if (letter) {
            if (
              letter.state === "correct" &&
              word[letter.index] !== letter.letter
            ) {
              return false;
            }
            if (letter.state === "present" && !word.includes(letter.letter)) {
              return false;
            }
            if (letter.state === "absent" && word.includes(letter.letter)) {
              return false;
            }
          }
        }
      }

      return true;
    })
  );
});
document.addEventListener("keydown", async (e) => {
  const key = e.key.toLowerCase();
  const isLetter = key >= "a" && key <= "z" && key.length === 1;
  let nextSelectedInput;
  if (isLetter) {
    if (selectedInput) {
      const i = inputLetters.indexOf(selectedInput);
      selectedInput.textContent = key;
      if (i < inputLetters.length - 1) {
        nextSelectedInput = inputLetters[i + 1];
      }
    } else {
      inputLetters[0].textContent = key;
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
      selectedInput = nextSelectedInput;
    }
  }
  updateFilters();
  updateLetterContent();
  updateFilters();
  if (nextSelectedInput) {
    selectedInput = nextSelectedInput;
  }
});
setWord(wordIndex);
restoreState();

function updateLetterContent() {
  const i = inputLetters.indexOf(selectedInput);
  const currentWordIndex = Math.floor(i / 5);
  const filter = filters[currentWordIndex];
  const wordSoFar = filter.reduce((acc, cur) => {
    if (cur) {
      return acc + cur.letter;
    }
    return acc;
  }, "");

  let correct = 0;
  for (let j = 4; j >= 0; j--) {
    const l = inputLetters[5 * currentWordIndex + j];
    if (l.textContent !== "") {
      const key = l.textContent;
      if (word[j] === key) {
        animate(l, "pop", "correct");
        correct++;
      } else if (
        (word[j] !== key &&
          word.includes(key) &&
          getOccurrence(word, key) >= getOccurrence(wordSoFar, key)) ||
        getOccurrence(word, key) >=
          getOccurrence(wordSoFar.slice(0, j + 1), key) + correct
      ) {
        animate(l, "pop", "present");
      } else animate(l, "pop", "absent");
    }
  }
}

function restoreState() {
  filters = JSON.parse(localStorage.getItem("filters")) || [
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const l = inputLetters[j + 5 * i];
      const current = filters[i][j];
      if (current) {
        l.textContent = current.letter;
        l.setAttribute("data-state", current.state);
      }
    }
  }
}

function updateFilters() {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const letter = inputLetters[j + 5 * i];
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
}

async function populateWord(w) {
  for (l of letters) {
    await populateLetter(l);
  }
  for (l of letters) {
    animate(l, undefined, undefined, "win");
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
