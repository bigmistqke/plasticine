import { createEffect, createMemo, createSignal, onMount } from "solid-js";
import fals from "fals";
import YAML from "yaml";
import { createStore } from "solid-js/store";

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
      onInput={(e) => setParent(props.key, e.target.value)}
    />
  );
};

const KeyValue = (props) => {
  createEffect(() => {
    if (!props.inline) console.log(props.entry());
  });
  return (
    <>
      {/* <div class={`text-blue-400 ${props.inline ? "inline-block" : ""}`}> */}
      {props.entry()[0]}:{props.inline ? "" : "\n"}
      <Value
        value={props.entry()[1]}
        parent={props.parent}
        key={props.entry()[0]}
      />
      {"\n"}
      {/* </div> */}
    </>
  );
};

const whitespaces = (layer) => new Array(layer).fill(" ").join();

const ValueArray = (props) => {
  const [canMount, setCanMount] = createSignal(true);
  /*   onMount(() => {
    // throttle mounting
    setTimeout(() => setCanMount(true), 0);
  }); */
  return (
    <Show when={canMount()}>
      <For each={props.value}>
        {(v, i) => {
          return (
            <>
              {"-"}
              <Value value={v} inline={true} parent={props.value} />
            </>
          );
        }}
      </For>
    </Show>
  );
};

const ValueObject = (props) => {
  const getEntries = createMemo(() => {
    return props.value
      ? Object.entries(props.value).sort((a, b) => (a[0] < b[0] ? -1 : 1))
      : [];
  });
  return (
    <>
      <Index each={getEntries()}>
        {(entry, i) => {
          const [key, value] = entry();

          return (
            <>
              <KeyValue
                entry={entry}
                key={key}
                value={value}
                inline={getEntries().length !== 1}
                // inline={true}
                parent={props.value}
              />
            </>
          );
        }}
      </Index>
    </>
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
          layer={props.layer}
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

const YamlRenderer = (props) => {
  return (
    <pre>
      <Value value={props.data} layer={0} />
    </pre>
  );
};

export default YamlRenderer;
