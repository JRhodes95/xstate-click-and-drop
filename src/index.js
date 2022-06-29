import "./styles.css";
import { createMachine, interpret } from "xstate";

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

function focusNextSibling() {
  document.activeElement.nextSibling?.focus();
}

function focusPreviousSibling() {
  document.activeElement.previousSibling?.focus();
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
  document.activeElement.classList.toggle("highlight");
  document.activeElement.setAttribute("aria-grabbed", true);
}

function dropFocusedElement() {
  document.activeElement.setAttribute("aria-grabbed", false);
  document.activeElement.classList.toggle("highlight");
}

// Machine instance with internal state
const listboxService = interpret(listboxMachine).start();

document.addEventListener("keydown", (event) =>
  listboxService.send(event.code)
);

document.getElementById("listbox").addEventListener("focusin", (event) => {
  listboxService.send("FOCUS_IN");
  event.preventDefault();
});

document
  .getElementById("listbox")
  .addEventListener("focusout", () => listboxService.send("FOCUS_OUT"));
