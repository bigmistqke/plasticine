import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
  Switch,
} from "solid-js";
import { tw } from "twind";

import getRestResponseFromSchema from "./helpers/getRestResponseFromSchema";

const css = (string, schema) => {
  try {
    let additional_classes = "";
    if (schema) {
      additional_classes += schema.class ? schema.class : "";
      additional_classes += schema.className ? schema.className : "";
    }
    return tw`${string} ${additional_classes}`;
  } catch (err) {}
};

const getFilenameFromPath = (path) => path.split("\\").pop().split("/").pop();

const getTypeFromPath = (path) => {
  if (!path) return false;
  try {
    let ext = path.split(".").pop().toLowerCase();
    let allowed_image_types = ["png", "gif", "jpg", "jpeg"];
    let allowed_video_types = ["mov", "mp4"];
    let allowed_audio_types = ["wav", "mp3"];

    if (allowed_image_types.includes(ext)) return "image";
    if (allowed_video_types.includes(ext)) return "video";
    if (allowed_audio_types.includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
  } catch (err) {
    console.error(path, err);
  }

  return "unknown";
};

const Input = (props) => {
  const getValue = createMemo(() => {
    if (!props.data) {
      return "";
    }
    if (typeof props.data === "object") {
      return "ERROR";
    }
    return props.data;
  });

  return (
    <input
      id={props.id}
      type={props.type}
      value={getValue()}
      onInput={(e) => {
        props.setData(...props.keys, e.target.value);
      }}
      placeholder={props.schema.placeholder}
      class={css(
        "border-slate-200 border-2 rounded-md w-full pl-5 outline-none focus:border-slate-500 hover:border-slate-500",
        props.schema
      )}
    />
  );
};
const Textarea = (props) => {
  const getValue = createMemo(() => {
    if (!props.data) {
      return "";
    }
    if (typeof props.data === "object") {
      return "ERROR";
    }
    return props.data;
  });
  return (
    <textarea
      id={props.id}
      value={getValue()}
      onInput={(e) => {
        props.setData(...props.keys, e.target.value);
      }}
      placeholder={props.schema.placeholder}
      class={css(
        "border-slate-200 border-2 rounded-md w-full pl-5 focus:border-slate-500 hover:border-slate-500",
        props.schema
      )}
    />
  );
};

const Preview = (props) => {
  let type = createMemo(() => getTypeFromPath(props.path));
  let className = "h-28 border-slate-200 border-2";
  return (
    <Switch fallback={<></>}>
      <Match when={type() === "image"}>
        <img src={props.file} class={className} />
      </Match>
      <Match when={type() === "video"}>
        <video src={props.path} class={className} />
      </Match>
      <Match when={type() === "audio"}>
        <audio src={props.path} class={className} />
      </Match>
      <Match when={type() === "pdf"}>
        <iframe href={props.path} class={className} />
      </Match>
    </Switch>
  );
};

const File = (props) => {
  const [path, setPath] = createSignal();
  const [file, setFile] = createSignal();
  const [previews, setPreviews] = createSignal({});

  createEffect(() => {
    setPath(props.data);
  });

  let ref;
  return (
    <>
      <div
        class={css(
          "pl-5 select-none bg-white border-slate-200 rounded-md border-2 w-full focus:border-slate-500 hover:border-slate-500",
          props.schema
        )}
        onClick={() => ref.click()}
      >
        <div>{getFilenameFromPath(path() ? path() : "click to upload")}</div>
        <Preview path={path()} file={file()}></Preview>
      </div>
      <input
        id={props.id}
        ref={ref}
        class="hidden"
        type="file"
        onInput={(e) => {
          setPath(e.target.value);
          setFile(URL.createObjectURL(e.target.files[0]));
          props.setData(...props.keys, getFilenameFromPath(path()));
        }}
      />
    </>
  );
};

const Tab = (props) => {
  return (
    <button
      onClick={props.onClick}
      class={` focus:outline-none bg-white w-12 border-2 ${
        props.selected ? "border-slate-500" : "border-slate-200"
      } rounded-md mr-2 hover:border-slate-500`}
    >
      {props.children}
    </button>
  );
};

const Repeater = (props) => {
  const [index, setIndex] = createSignal(0);

  createEffect(() => {
    // if a parent-repeater changed its index and
    // the index of this repeater is set to an index too high
    if (!props.data) return;
    if (!props.data[index()]) {
      setIndex(props.data.length - 1);
    }
  });

  const getDataLength = createMemo(() =>
    props.data ? props.data.length - 1 : 0
  );
  return (
    <div class={css(`bg-white flex w-full mb-1 flex-col`, props.schema)}>
      <div class="flex w-full">
        <label class="flex-0 w-36" for={props.id}>
          {props.key}
        </label>
        <div class="flex-1 pb-1 flex">
          <div>
            <Tab
              onClick={() => {
                props.setData(...props.keys, (elements) => [
                  ...elements,
                  getRestResponseFromSchema(props.schema.content),
                ]);
                setIndex(getDataLength());
              }}
            >
              +
            </Tab>
          </div>
          <div class="flex-1">
            <For each={props.data}>
              {(d, i) => (
                <Tab selected={index() === i()} onClick={() => setIndex(i())}>
                  {i()}
                </Tab>
              )}
            </For>
          </div>
        </div>
      </div>
      <Values
        schema={props.content}
        keys={[...props.keys, index()]}
        data={props.data ? props.data[index()] : undefined}
        setData={props.setData}
      />
    </div>
  );
};

const Container = (props) => {
  return (
    <div class={css(`bg-white flex w-full mb-1 flex-col`, props.schema)}>
      <label class="flex-0 w-36" for={props.id}>
        {props.key}
      </label>
      <Values
        schema={props.content}
        keys={[...props.keys]}
        data={props.data ? props.data : undefined}
        setData={props.setData}
      />
    </div>
  );
};

const Value = (props) => {
  const random_id = createUniqueId();

  const keys = createMemo(() =>
    props.keys ? [...props.keys, props.schema.key] : undefined
  );

  return (
    <Switch fallback={<></>}>
      <Match
        when={
          props.schema.type !== "repeater" && props.schema.type !== "container"
        }
      >
        <Show when={props.schema}>
          <div class={`flex w-full mb-1`}>
            <label class="flex-0 w-36" for={random_id}>
              {props.schema.key}
            </label>
            <div class="flex-1">
              <Switch
                fallback={
                  <Input
                    type="text"
                    id={random_id}
                    key={props.schema.key}
                    data={props.data}
                    keys={keys()}
                    setData={props.setData}
                    schema={props.schema}
                  />
                }
              >
                <Match when={props.schema.type === "text"}>
                  <Input
                    type="text"
                    id={random_id}
                    key={props.schema.key}
                    data={props.data}
                    keys={keys()}
                    setData={props.setData}
                    schema={props.schema}
                  />
                </Match>
                <Match when={props.schema.type === "file"}>
                  <File
                    id={random_id}
                    key={props.schema.key}
                    data={props.data}
                    keys={keys()}
                    setData={props.setData}
                    schema={props.schema}
                  />
                </Match>
                <Match when={props.schema.type === "textarea"}>
                  <Textarea
                    type="text"
                    key={props.schema.key}
                    id={random_id}
                    data={props.data}
                    keys={keys()}
                    setData={props.setData}
                    schema={props.schema}
                  />
                </Match>
              </Switch>
            </div>
          </div>
        </Show>
      </Match>
      <Match when={props.schema.type === "repeater"}>
        <Repeater
          id={random_id}
          key={props.schema.key}
          content={props.schema.content}
          keys={keys()}
          data={props.data}
          setData={props.setData}
          schema={props.schema}
        />
      </Match>
      <Match when={props.schema.type === "container"}>
        <Container
          id={random_id}
          key={props.schema.key}
          content={props.schema.content}
          keys={keys()}
          data={props.data}
          setData={props.setData}
          schema={props.schema}
        />
      </Match>
    </Switch>
  );
};

const Values = (props) => {
  return (
    <div class="pl-5 align-top w-full border-slate-200 ">
      <Index each={props.schema}>
        {(s, i) => {
          return (
            <div>
              <Value
                schema={s()}
                data={props.data ? props.data[s().key] : undefined}
                keys={props.keys}
                setData={props.setData}
                class={
                  props.data[s().key].class || props.data[s().key].className
                }
              />
            </div>
          );
        }}
      </Index>
    </div>
  );
};

const Tabs = (props) => {
  const [selected, setSelected] = createSignal(props.selected);

  return (
    <div class={`flex ${props.class}`}>
      <div>
        <Tab onClick={props.add}>+</Tab>
      </div>
      <div class="flex-1">
        <For each={new Array(props.amount).fill("")}>
          {(d, i) => (
            <Tab
              selected={props.selected === i()}
              onClick={() => {
                setSelected(i);
                props.setSelected(i());
              }}
            >
              {i()}
            </Tab>
          )}
        </For>
      </div>
    </div>
  );
};

const CmsRenderer = (props) => {
  const [postId, setPostId] = createSignal(0);
  return (
    <div class="flex flex-col overflow-hidden">
      <Tabs
        selected={postId()}
        amount={Object.keys(props.data).length}
        setSelected={setPostId}
        add={() => {
          props.addPost();
          setPostId(Object.keys(props.data).length - 1);
        }}
        class="mb-2 border-b-2 p-2"
      ></Tabs>
      <div class="flex-1 p-5 overflow-auto">
        <Switch fallback={<span>ERROR</span>}>
          <Match when={Array.isArray(props.schema)}>
            <Values
              schema={props.schema}
              data={props.data[postId()]}
              setData={props.setData}
              add_comma={props.add_comma}
              keys={[postId()]}
            />
          </Match>
          <Match
            when={
              !Array.isArray(props.schema) && props.schema instanceof Object
            }
          >
            <Value
              schema={props.schema}
              data={props.data[postId()]}
              setData={props.setData}
              add_comma={props.add_comma}
              keys={[postId()]}
            />
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default CmsRenderer;
