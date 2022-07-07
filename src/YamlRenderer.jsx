import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onMount,
} from "solid-js";
import fals from "fals";
import YAML from "yaml";
import { createStore } from "solid-js/store";

const YamlRenderer = (rootProps) => {
  const Editable = (props) => {
    let dom;
    let [, setParent] = createStore(props.parent);

    const update = (string) => {
      if (fals(string)) {
        dom.style.width = "1ch";
        return;
      }
      dom.style.width = Math.max(1, string.length) + "ch";
    };

    createEffect(() => update(props.value));

    return (
      <input
        ref={dom}
        class={`ml-3 text-blue-600 bg-transparent w-100`}
        value={props.value}
        spellcheck="false"
        id={props.id}
        onInput={(e) => {
          setParent(props.key, e.target.value);
          if (rootProps.onUpdate) rootProps.onUpdate();
        }}
      />
    );
  };

  const KeyValue = (props) => {
    let id = createUniqueId();

    const isSingleValue = createMemo(
      () =>
        !(
          Array.isArray(props.entry()[1]) ||
          typeof props.entry()[1] === "object"
        )
    );

    return (
      <div
        class={`${isSingleValue() ? "text-blue-400" : "text-gray-400"} ${
          props.inline ? "inline-block" : ""
        }`}
      >
        <label for={id}>{props.entry()[0]}</label>
        :
        <Value
          value={props.entry()[1]}
          parent={props.parent}
          key={props.entry()[0]}
          id={id}
        />
      </div>
    );
  };

  const ValueArray = (props) => {
    const [canMount, setCanMount] = createSignal(true);
    /*   onMount(() => {
      // throttle mounting
      setTimeout(() => setCanMount(true), 0);
    }); */
    return (
      <Show when={canMount()}>
        {/* <div class="align-top"> */}
        <For each={props.value}>
          {(v, i) => {
            return (
              <div>
                <div class="inline-block">-</div>
                <Value value={v} inline={true} parent={props.value} />
              </div>
            );
          }}
        </For>
        {/* </div> */}
      </Show>
    );
  };

  const ValueObject = (props) => {
    const getEntries = createMemo(() => {
      return props.value
        ? Object.entries(
            props.value
          ) /* .sort((a, b) => (a[0] < b[0] ? -1 : 1)) */
        : [];
    });
    return (
      <div
        class={`${
          props.inline ? "inline-block" : ""
        } pl-2 align-top  whitespace-nowrap`}
      >
        <Index each={getEntries()}>
          {(entry, i) => {
            const [key, value] = entry();

            return (
              // <div class="pl-2">
              <KeyValue
                entry={entry}
                key={key}
                value={value}
                inline={props.inline && i == 0}
                parent={props.value}
              />
              // </div>
            );
          }}
        </Index>
      </div>
    );
  };

  const ValueSingle = (props) => {
    var isNumber = function isNumber(value) {
      return typeof value === "number" && isFinite(value);
    };
    return (
      <Editable
        value={props.value}
        parent={props.parent}
        setValue={props.setValue}
        key={props.key}
        id={props.id}
      />
    );
  };

  const Value = (props) => {
    return (
      <Switch
        fallback={
          <ValueSingle
            value={props.value}
            inline={props.inline}
            parent={props.parent}
            setValue={props.setValue}
            key={props.key}
            id={props.id}
          />
        }
      >
        <Match when={Array.isArray(props.value)}>
          <ValueArray value={props.value} inline={true} />
        </Match>
        <Match
          when={!Array.isArray(props.value) && props.value instanceof Object}
        >
          <ValueObject value={props.value} inline={props.inline} />
        </Match>
      </Switch>
    );
  };

  return <Value value={rootProps.data} />;
};

export default YamlRenderer;
