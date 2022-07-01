import "./styles.css";
import { createMachine, interpret } from "xstate";

function focusNextSibling() {
  document.activeElement?.nextElementSibling?.focus();
}

function focusPreviousSibling() {
  document.activeElement?.previousElementSibling?.focus();
}

function moveItemUp() {
  const selectedElement = document.activeElement;
  selectedElement.previousSibling?.before(selectedElement);
  selectedElement.focus();
}

function moveItemDown() {
  const selectedElement = document.activeElement;
  selectedElement.nextSibling?.after(selectedElement);
  selectedElement.focus();
}

function grabFocusedElement() {
  document.activeElement.classList.add("highlight");
  document.activeElement.setAttribute("aria-grabbed", true);
}

function dropFocusedElement() {
  document.activeElement.setAttribute("aria-grabbed", false);
  document.activeElement.classList.remove("highlight");
}

const listboxMachine = createMachine({
  id: "listboxMachine",
  initial: "notFocused",

  states: {
    focused: {
      initial: "noItemSelected",

      states: {
        hist: {
          type: "history",
          history: "shallow"
        },
        itemSelected: {
          on: {
            Space: {
              target: "noItemSelected",
              actions: [dropFocusedElement]
            },
            ArrowUp: {
              target: "itemSelected",
              actions: [moveItemUp]
            },
            ArrowDown: {
              target: "itemSelected",
              actions: [moveItemDown]
            }
          }
        },
        noItemSelected: {
          on: {
            ArrowUp: {
              actions: [focusPreviousSibling]
            },
            ArrowDown: {
              actions: [focusNextSibling]
            },
            Space: {
              target: "itemSelected",
              actions: [grabFocusedElement]
            }
          }
        }
      },
      on: {
        FOCUS_OUT: {
          target: "notFocused",
          actions: []
        }
      }
    },
    notFocused: {
      on: {
        FOCUS_IN: {
          target: "focused.hist"
        }
      }
    }
  }
});

// Machine instance with internal state
const listboxService = interpret(listboxMachine).start();
// .onTransition((state) => console.log(state))
// .onEvent((event) => console.log(event))

const listItems = document.querySelectorAll(".draggable-item");

listItems.forEach((item) => {
  item.addEventListener("dragstart", handleDragStart);
  item.addEventListener("dragenter", handleDragEnter);
  item.addEventListener("dragover", handleDragOver);
  item.addEventListener("dragleave", handleDragLeave);
  item.addEventListener("drop", handleDrop);
  item.addEventListener("dragend", handleDragEnd);
});

let dragSrcEl = null;

function handleDragStart(event) {
  event.target.classList.add("highlight");
  dragSrcEl = this;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", this.innerHTML);
}

function handleDragEnd(event) {
  event.target.classList.remove("highlight");
  listItems.forEach(function (item) {
    item.classList.remove("over");
  });
}

function handleDragEnter(event) {
  event.target.classList.add("over");
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = "move";

  return false;
}

function handleDragLeave(event) {
  event.target.classList.remove("over");
}

function handleDrop(e) {
  e.stopPropagation(); // stops the browser from redirecting.

  if (dragSrcEl !== this) {
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData("text/html");
  }

  return false;
}

document.addEventListener("keydown", handleKeydown);

document
  .getElementById("listbox")
  .addEventListener("focusin", (event) => listboxService.send("FOCUS_IN"));

document
  .getElementById("listbox")
  .addEventListener("focusout", () => listboxService.send("FOCUS_OUT"));

document.getElementById("save-order").addEventListener("click", handleSave);

function handleKeydown(event) {
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
      event.code
    ) > -1
  ) {
    event.preventDefault();
  }
  listboxService.send(event.code);
}

function handleSave() {
  const listbox = document.getElementById("listbox");
  const listItems = Array.from(listbox.querySelectorAll("#item-value"));
  const itemsInOrder = listItems.map((listItem) => ({
    id: listItem.dataset.itemid,
    name: listItem.textContent
  }));

  console.log(itemsInOrder);

  const outputListbox = document.getElementById("output-list");

  const outputMarkup = itemsInOrder.reduce(
    (prev, { id, name }) => `${prev} <li id=${id}>${name}</li>`,
    ""
  );

  outputListbox.innerHTML = outputMarkup;
}
