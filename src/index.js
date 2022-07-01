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
  document.activeElement.classList.toggle("highlight");
  document.activeElement.setAttribute("aria-grabbed", true);
}

function dropFocusedElement() {
  document.activeElement.setAttribute("aria-grabbed", false);
  document.activeElement.classList.toggle("highlight");
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
const listboxService = interpret(listboxMachine)
  .onTransition((state) => console.log(state))
  .onEvent((event) => console.log(event))
  .start();

document.addEventListener("keydown", (event) => {
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
      event.code
    ) > -1
  ) {
    event.preventDefault();
  }
  listboxService.send(event.code);
});

document.getElementById("listbox").addEventListener("focusin", (event) => {
  listboxService.send("FOCUS_IN");
  event.preventDefault();
});

document
  .getElementById("listbox")
  .addEventListener("focusout", () => listboxService.send("FOCUS_OUT"));
