import {
  createMemo,
  createSignal,
  createUniqueId,
  onMount,
  Show,
} from "solid-js";
import fals from "fals";

const ValueArray = (props) => {
  return (
    <div class="pl-4 align-top">
      [
      <For each={props.value}>
        {(v, i) => {
          let add_comma = createMemo(() => i() !== props.value.length - 1);
          return (
            <div>
              <Value value={v} add_comma={add_comma()} />
            </div>
          );
        }}
      </For>
      ]<Show when={props.add_comma}>,</Show>
    </div>
  );
};

const ValueObject = (props) => {
  return (
    <div class="pl-4 align-top  whitespace-nowrap">
      &#123;
      <For each={props.value ? Object.entries(props.value) : []}>
        {([key, value], i) => {
          let add_comma = createMemo(
            () => i() !== Object.entries(props.value).length - 1
          );
          return (
            <div class="pl-4">
              <KeyValue key={key} value={value} add_comma={add_comma()} />
            </div>
          );
        }}
      </For>
      &#125;
      <Show when={props.add_comma}>,</Show>
    </div>
  );
};

const ValueSingle = (props) => {
  var isNumber = function isNumber(value) {
    return typeof value === "number" && isFinite(value);
  };
  return (
    <div class="pl-4 inline-block align-top">
      <Editable
        value={props.value}
        class="text-blue-600"
        showQuotes={!isNumber(props.value)}
      />
      <Show when={props.add_comma}>,</Show>
    </div>
  );
};

const Value = (props) => {
  return (
    <>
      <Switch
        fallback={
          <ValueSingle value={props.value} add_comma={props.add_comma} />
        }
      >
        <Match when={Array.isArray(props.value)}>
          <ValueArray value={props.value} add_comma={props.add_comma} />
        </Match>
        <Match
          when={!Array.isArray(props.value) && props.value instanceof Object}
        >
          <ValueObject value={props.value} add_comma={props.add_comma} />
        </Match>
      </Switch>
    </>
  );
};

const Editable = (props) => {
  const [value, setValue] = createSignal();
  const id = createUniqueId();
  let dom;

  const update = (value) => {
    // setValue(value);

    if (fals(value)) {
      dom.style.width = "1ch";
      setValue("");
      return;
    }
    dom.style.width = Math.max(1, value.toString().length) + "ch";
    if (props.update) props.update(value);
    setValue(value);
  };

  onMount(() => setTimeout(update(props.value), 100));

  return (
    <span class={`w-100 ${props.class}`}>
      <Show when={props.showQuotes}>
        <label for={id}>"</label>
      </Show>
      <input
        ref={dom}
        id={id}
        value={value()}
        class="bg-transparent"
        onInput={(e) => update(e.target.value)}
      />
      <Show when={props.showQuotes}>
        <label for={id}>"</label>
      </Show>
    </span>
  );
};

const KeyValue = (props) => {
  return (
    <>
      <Editable value={props.key} class="text-blue-400" showQuotes={true} />
      :
      <Value value={props.value} add_comma={props.add_comma} />
    </>
  );
};

const DataRenderer = (props) => {
  return (
    <div class="text-gray-500">
      <Value value={props.data} />
    </div>
  );
};

export default DataRenderer;
