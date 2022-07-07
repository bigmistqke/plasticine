import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Switch,
} from "solid-js";
import JsonRenderer from "./JsonRenderer";
import YamlRenderer from "./YamlRenderer";
// import YamlRenderer from "./YamlRenderer2";

import YAML from "yaml";

const DataRenderer = (props) => {
  const [type, setType] = createSignal("yaml");

  const GetRenderer = createMemo(() => {
    switch (type()) {
      case "json":
        // return <JsonRenderer data={props.data} />;
        return <pre>{JSON.stringify(props.data, null, 2)}</pre>;
      case "yaml":
        return <YamlRenderer data={props.data} onUpdate={props.onUpdate} />;
      // return <pre>{YAML.stringify(props.data)}</pre>;
    }
  });

  return (
    <div class="text-neutral-600 flex-1 flex flex-col border-r-2 text-xs overflow-auto">
      <div class="flex h-10 p-2 border-b-2 text-sm">
        <span class="flex-1">{props.label}</span>
        <select value={type()} onInput={(e) => setType(e.target.value)}>
          <option value="json">json</option>
          <option value="yaml">yaml</option>
        </select>
      </div>
      <div class="flex-1 border-b-2 p-5 bg-neutral-50 font-mono  overflow-scroll">
        {GetRenderer()}
      </div>
    </div>
  );
};

export default DataRenderer;
