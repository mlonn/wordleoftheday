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

let wordIndex = days;
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
const inputLetters = [];
const boardState = ["", "", "", "", "", ""];
const evaluations = [null, null, null, null, null];
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
for (letter of word) {
  const l = document.createElement("div");
  l.className = "tile";
  l.addEventListener("click", async () => {
    const i = inputLetters.indexOf(l);
    let state = l.getAttribute("data-state");
    console.log(state);
    switch (state) {
      case "empty":
        state = "absent";
        break;
      case "absent":
        state = "present";
        break;
      case "present":
        state = "correct";
        break;
      case "correct":
        state = "empty";
        break;
      default:
        break;
    }
    await animate(l, "pop", state);
    animate(l, "idle");
    evaluations[i] = state;
  });

  document.getElementById("input").appendChild(l);
  l.appendChild(document.createElement("span"));
  inputLetters.push(l);
}
document.addEventListener("keydown", async (e) => {
  const key = e.key;
  const isLetter = key >= "a" && key <= "z" && key.length === 1;
  if (isLetter) {
    if (selectedInput) {
      const i = inputLetters.indexOf(selectedInput);
      if (i < inputLetters.length && selectedInput.textContent === "") {
        selectedInput.textContent = e.key;
      }
      if (i < inputLetters.length - 1) {
        await animate(selectedInput, "pop");
        animate(selectedInput, "idle");
        selectedInput = inputLetters[i + 1];
      }
    } else {
      selectedInput = inputLetters[0];
      await animate(selectedInput, "pop");
      animate(selectedInput, "idle");
      selectedInput.textContent = e.key;
      selectedInput = inputLetters[1];
    }
  }
  if (key === "Backspace" && selectedInput) {
    if (selectedInput.textContent !== "") {
      const i = inputLetters.indexOf(selectedInput);
      selectedInput.textContent = "";
      await animate(selectedInput, "pop");
      animate(selectedInput, "idle");
      selectedInput = inputLetters[i - 1];
    } else {
      const i = inputLetters.indexOf(selectedInput);
      selectedInput = inputLetters[i - 1];
      if (selectedInput) {
        selectedInput.textContent = "";
        await animate(selectedInput, "pop");
        animate(selectedInput, "idle");
      }
    }
  }
});
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
  for (l of inputLetters) {
    animate(l, "pop", "empty");
    l.classList.remove("win");
    l.textContent = "";
  }
  for (l of letters) {
    animate(l, "idle");
  }
  for (l of inputLetters) {
    animate(l, "idle");
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
