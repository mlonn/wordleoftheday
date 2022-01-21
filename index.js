const start = new Date(2021, 5, 19, 0, 0, 0, 0);

const today = new Date();
const diff = today.getTime() - start.getTime();
let wordIndex = Math.ceil(diff / (1000 * 3600 * 24)) - 1;
let interval;
const word = words[wordIndex];
const subtitle = document.getElementById("subtitle");
subtitle.textContent = `Wordle ${wordIndex}`;
const row = document.getElementById("word");
const prev = document.getElementById("prev");
prev.id = "prev";
prev.textContent = "PREV";

prev.addEventListener("click", () => {
  if (wordIndex > 0) {
    wordIndex--;
    populateWord(words[wordIndex]);
    subtitle.textContent = `Wordle ${wordIndex}`;
  } else {
    prev.disabled = true;
  }
});

const letters = [];
for (letter of word) {
  l = document.createElement("div");
  l.className = "tile";
  row.appendChild(l);
  letters.push(l);
}
populateWord(word);

const next = document.getElementById("next");
next.id = "next";
next.textContent = "NEXT";
next.addEventListener("click", () => {
  if (wordIndex < days) {
    wordIndex++;
    populateWord(words[wordIndex]);
    subtitle.textContent = `Wordle ${wordIndex}`;
  } else {
    next.disabled = true;
  }
});
const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (preferDark) {
  document.body.className = "nightmode";
}
function clearLetters() {
  for (l of letters) {
    l.setAttribute("data-state", "empty");
    l.setAttribute("data-animation", "pop");
    l.classList.remove("win");
    l.textContent = "";
  }
}

function populateWord(w) {
  clearInterval(interval);
  clearLetters();
  let index = 0;
  interval = setInterval(() => {
    letters[index].setAttribute("data-animation", "flip-in");
    index++;
    if (index > 0) {
      letters[index - 1].setAttribute("data-animation", "flip-out");
      letters[index - 1].setAttribute("data-state", "correct");
      letters[index - 1].textContent = w[index - 1];
    }
    if (index > letters.length - 1) {
      for (l of letters) {
        l.setAttribute("data-animation", "idle");
        l.classList.add("win");
        clearInterval(interval);
      }
    }
  }, 250);
}
