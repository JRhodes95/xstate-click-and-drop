import "./styles.css";
import { createMachine, interpret, assign } from "xstate";

const listItems = [
  { id: "001", name: "Ice Cream" },
  { id: "002", name: "Pie" },
  { id: "003", name: "Cake" },
  { id: "004", name: "Cupcake" }
];

const listboxMachine = createMachine({
  id: "listboxMachine",
  initial: "notFocused",
  context: {
    focusIndex: 0,
    listItems
  },
  states: {
    focused: {
      entry: ({ listItems, focusIndex }) =>
        document.getElementById(`${listItems[focusIndex].id}`).focus(),
      on: {
        FOCUS_OUT: {
          target: "notFocused"
        },
        ArrowUp: {
          target: "focused",

          actions: [
            assign({
              focusIndex: ({ focusIndex }) =>
                focusIndex === 0 ? focusIndex : focusIndex - 1
            })
          ]
        },
        ArrowDown: {
          target: "focused",
          actions: [
            assign({
              focusIndex: ({ focusIndex }) =>
                focusIndex === listItems.length - 1
                  ? focusIndex
                  : focusIndex + 1
            })
          ]
        }
      }
    },
    notFocused: {
      on: {
        FOCUS_IN: {
          target: "focused"
        }
      }
    }
  }
});

// Machine instance with internal state
const listboxService = interpret(listboxMachine)
  .onTransition((state) => render(state))
  .start();

function makeListItem({ id, name }, index) {
  return `<li id="${id}" role="option" aria-describedby="operation" tabindex="${
    index === 0 ? 0 : -1
  }">${name}</li>`;
}

function render({ context: { focusIndex, listItems }, value: state }) {
  const focusIndexDiv = document.getElementById("focusIndex");
  renderIfChanged(focusIndexDiv, `Focus index: ${focusIndex}`);

  const stateDiv = document.getElementById("state");
  renderIfChanged(stateDiv, `State: ${state}`);

  const listElements = listItems
    .map((item, index) => makeListItem(item, index))
    .join("");

  const listboxElement = document.getElementById("listbox");
  renderIfChanged(listboxElement, listElements);
}

function renderIfChanged(element, content) {
  const currentContent = element.innerHTML;
  if (currentContent === content) return;
  console.log("rerendering");
  element.innerHTML = content;
}

function handleKeydown(event) {
  listboxService.send(event.code);
}

document.addEventListener("keydown", handleKeydown);

document
  .getElementById("listbox")
  .addEventListener("focusin", () => listboxService.send("FOCUS_IN"));

document
  .getElementById("listbox")
  .addEventListener("focusout", () => listboxService.send("FOCUS_OUT"));
