import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import ARRAY from "./lib/ARRAY";
import deproxy from "./helpers/deproxy";

import CmsRenderer from "./CmsRenderer";
import DataRenderer from "./DataRenderer";
import TrashbinManager from "./TrashbinManager";

import diffArrays from "./helpers/diffArrays";
import { isDataNodeEmpty, getDataNodesFromKeys } from "./helpers/dataHelpers";
import getRestResponseFromSchema from "./helpers/getRestResponseFromSchema";
import SCHEMA from "./helpers/SCHEMA";
import { parse } from "yaml";

const example = {
  json: `[
  {
    "type": "repeater",
    "key": "files",
    "content": [
      {
        "type": "text",
        "key": "title"
      },
      {
        "type": "file",
        "key": "file"
      },
      {
        "type": "textarea",
        "key": "description"
      }
    ]
  },
  {
    "type": "repeater",
    "key": "texts",
    "content": [
      {
        "type": "text",
        "key": "title"
      },
      {
        "type": "textarea",
        "key": "text"
      }
    ]
  }
]`,
  jsx: `<Repeater key="files">
  <Text key="title"/>
  <File key="file"/>
  <Textarea key="description"/>
</Repeater>  
<Repeater key="texts">
  <Text key="title"/>
  <Textarea key="text"/>
</Repeater>`,
  yaml: `- type: repeater
  key: files
  content: 
   - type: text
     key: title
   - type: file
     key: file
   - type: textarea
     key: description
- type: repeater
  key: texts
  content: 
   - type: text
     key: title
   - type: textarea
     key: text`,
  jsx: "",
};

function App() {
  const [format, setFormat] = createSignal("jsx");
  const [automerge, setAutomerge] = createSignal(true);
  const [canRawSchemaParse, setCanRawSchemaParse] = createSignal(true);

  const [rawSchema, setRawSchema] = createSignal(example[format()]);
  const [parsedSchema, setParsedSchema] = createStore(
    SCHEMA.parse(rawSchema(), format())
  );

  const [postData, setPostData] = createStore({
    0: getRestResponseFromSchema(parsedSchema),
  });
  const [trashbin, setTrashbin] = createStore([]);

  const possibleFormats = ["jsx", "json", "yaml"];
  let textarea;

  onMount(() => textarea.focus());

  const labelNumbersInArray = (array) =>
    array.map((el) => (typeof el === "number" ? "[]" : el));

  const deleteFromTrashbin = (item) => {
    setTrashbin((trasbin) =>
      trashbin.filter(
        (el) => !diffArrays(item.keys, labelNumbersInArray(el.keys)).equals
      )
    );
  };

  const restoreFromTrashbin = (category) => {
    try {
      // check first if path still exists

      // TODO: maybe it makes more sense to check out the schema instead of the postData

      const path = [...category.keys],
        layer = postData;
      const new_key = path.pop();
      path.forEach((key) => {
        if (!layer) return;
        if (key !== "[]") {
          layer = layer[key];
        } else {
          layer = layer[0];
        }
      });
      if (layer) {
        const [schemaPath] = SCHEMA.getSchemaPathFromDataPath(path);
        if (!schemaPath) {
          console.error("SCHEMAPATH IS UNDEFINED!!!");
          return;
        }
        // add path to schema
        setParsedSchema(...schemaPath, (array) => {
          if (!Array.isArray(array)) {
            console.error("WHY? ", array);
            return array;
          }
          return [...array, { type: "text", key: new_key }];
        });
        // update raw text
        setRawSchema(SCHEMA.stringify(parsedSchema, format()));

        // add values to data
        category.elements.forEach((el) => {
          setPostData(...el.keys, el.value);
        });
        return true;
      } else {
        return false;
      }

      // TODO: allow to patch broken paths
    } catch (err) {
      console.error("error", err);
      return false;
    }
  };

  const tryToParseSchema = (string, format) => {
    const parsed = SCHEMA.parse(string, format);
    if (!parsed) {
      setCanRawSchemaParse(false);
    } else {
      setCanRawSchemaParse(true);
    }
    return parsed;
  };

  const prettify = () => {
    setRawSchema(SCHEMA.stringify(parsedSchema, format()));
  };

  const createDataFromSchemaDiff = ({ keys, schema }) => {
    const keyToCreate = keys.pop();

    const postNodes = Object.keys(postData).map((postId) => ({
      postId,
      data: getDataNodesFromKeys(postData, [postId, ...keys]),
    }));

    const trashIndex = automerge()
      ? trashbin.findIndex((entry) => {
          if (!entry.posts) return false;
          return (
            diffArrays(entry.keys, keys).equals &&
            SCHEMA.diff(entry.schema, schema).equals
          );
        })
      : -1;

    if (trashIndex == -1) {
      postNodes.forEach((postNode) =>
        postNode.data.forEach((dataNode) => {
          const [, setParent] = createStore(dataNode);
          let response = getRestResponseFromSchema(schema);

          setParent(...response);
        })
      );
      return;
    }

    const trash = trashbin[trashIndex];
    let allRemainingDatas = [];

    trash.posts.forEach(({ postId, data: trashData, keys }) => {
      let postNode = postNodes.find((postNode) => postNode.postId === postId);
      let remainingData = [...trashData];

      postNode.data.forEach((dataNode, index) => {
        const [parent, setParent] = createStore(dataNode);
        const node = trashData.find((el) => el.index === index);
        if (!node) {
          console.log("THIS SHOULD HAPPEN");
          setParent(...getRestResponseFromSchema(schema));
          return;
        }
        setParent(keyToCreate, node.node);
        // update remainingData
        remainingData = remainingData.filter((el) => el.index !== index);
        setTrashbin(trashIndex, "data", remainingData);
      });
      allRemainingDatas = [...allRemainingDatas, ...remainingData];
    });
    // if there is no more data inside the the trash-element
    if (allRemainingDatas.length === 0) {
      // delete it from the trashbin
      setTrashbin((array) => ARRAY.remove(array, trashIndex));
    }
  };

  const deleteDataFromSchemaDiff = ({ keys, schema }) => {
    // remove node from data
    const keyToDelete = keys.pop();

    const postNodes = Object.keys(postData).map((postId) => {
      return {
        postId,
        data: getDataNodesFromKeys(postData, [postId, ...keys]),
      };
    });

    let posts = [];
    postNodes.forEach(({ postId, data }) => {
      // get the dataNodes before you delete them

      const dataNodes = data
        .map((dataParentNode, index) => ({
          node: dataParentNode ? dataParentNode[keyToDelete] : undefined,
          index,
        }))
        .filter(({ node }) => !isDataNodeEmpty(node));

      data.forEach((parentNode) => {
        const [, setParent] = createStore(parentNode);
        setParent(keyToDelete, undefined);
      });

      if (dataNodes.length > 0) {
        posts.push({
          postId,
          data: dataNodes,
        });
      }
    });

    if (posts.length !== 0)
      setTrashbin((array) => [...array, { schema, posts, keys }]);
  };

  const updateDataFromSchemaDiff = ({ keys, from, to, type, schema }) => {
    if (type === "key") {
      Object.keys(postData).forEach((index) => {
        getDataNodesFromKeys(postData, [index, ...keys]).forEach((dataNode) => {
          const [parent, setParent] = createStore(dataNode);
          batch(() => {
            setParent(to, parent[from]);
            setParent(from, undefined);
          });
        });
      });
    } else if (type === "type") {
      if (from.type === "repeater" && to.type !== "repeater") {
        // delete content from data
        getDataNodesFromKeys(postData, keys).forEach((dataNode) => {
          const [parent, setParent] = createStore(dataNode);

          const dataNodes = getDataNodesFromKeys(postData, [...keys, to.key])
            .map((node, index) => ({
              node,
              index,
            }))
            .filter(({ node }) => !isDataNodeEmpty(node));

          // look for trashbin for matching keys
          const matchIndex = automerge()
            ? trashbin.findIndex((el) => {
                return diffArrays(el.keys, [...keys, to.key]).equals;
              })
            : -1;

          if (dataNodes.length !== 0) {
            setTrashbin((array) => [
              ...array,
              {
                schema: SCHEMA.content,
                keys: [...keys, to.key],
                data: dataNodes,
              },
            ]);
          }
          if (matchIndex !== -1) {
            const trashMatch = trashbin[matchIndex];
            setParent(from.key, trashMatch.data[0]);
            setTrashbin((array) => ARRAY.remove(array, matchIndex));
          } else {
            setParent(from.key, "");
          }
        });
      } else if (from.type !== "repeater" && to.type === "repeater") {
        // delete content from data
        const defaultData = getRestResponseFromSchema(SCHEMA.content);

        getDataNodesFromKeys(postData, keys).forEach((dataNode) => {
          const [parent, setParent] = createStore(dataNode);

          // look for trashbin for matching keys
          const matchIndex = automerge()
            ? trashbin.findIndex((el) => {
                return diffArrays(el.keys, [...keys, to.key]).equals;
              })
            : -1;

          if (parent[to.key] !== "") {
            const dataNodes = getDataNodesFromKeys(postData, [...keys, to.key]);
            setTrashbin((trashbin) => [
              ...trashbin,
              {
                keys: [...keys, to.key],
                schema: "",
                data: dataNodes,
              },
            ]);
          }

          if (matchIndex !== -1) {
            const trashMatch = trashbin[matchIndex];
            const highestIndex = 0;
            trashMatch.data.forEach(({ index }) => {
              if (index > highestIndex) highestIndex = index;
            });

            const content = new ARRAY.create(highestIndex + 1, defaultData).map(
              (el, index) => {
                const dataMatch = trashMatch.data.find(
                  (el) => el.index === index
                );
                if (dataMatch) {
                  return dataMatch.node;
                }
                return el;
              }
            );

            setParent(from.key, content);
            setTrashbin((trashbin) => ARRAY.remove(trashbin, matchIndex));
          } else {
            setParent(from.key, [defaultData]);
          }
        });
      } else {
      }
    }
  };

  const transformDataFromSchemaDiff = ({ created, deleted, updated }) => {
    batch(() => {
      created.forEach(createDataFromSchemaDiff);
      deleted.forEach(deleteDataFromSchemaDiff);
      updated.forEach(updateDataFromSchemaDiff);
    });
  };

  const updateSchemaAndData = (from, to) => {
    const diff = SCHEMA.diff(from, to);
    console.log("updateSchemaAndData", from, to, diff);

    transformDataFromSchemaDiff(diff);
    if (to) setParsedSchema(to);
  };

  return (
    <div class="flex flex-col h-full">
      <div class="flex h-full border-b-2">
        <div class="w-1/2 flex-1 flex flex-col border-r-2">
          <div class="flex-1 h-1/2 flex flex-col  border-b-2">
            <div class="h-10 flex text-base w-full p-2 border-b-2">
              <div class="flex-1">
                <button
                  class=" focus:outline-none text-sm ml-2 pl-2 pr-2 hover:border-slate-500 border-2 border-slate-200 rounded-md "
                  onClick={() => setAutomerge(!automerge())}
                >
                  auto-merge: {automerge() ? "on" : "off"}
                </button>
                <button
                  class=" focus:outline-none text-sm ml-2 pl-2 pr-2 hover:border-slate-500 border-2 border-slate-200 rounded-md"
                  onClick={prettify}
                >
                  prettify
                </button>
              </div>

              <select
                value={format()}
                class="flex-0 pl-1 pl-2 focus:outline-none"
                onInput={(e) => {
                  setFormat(e.target.value);
                  setRawSchema(SCHEMA.stringify(parsedSchema, format()));
                }}
              >
                <For each={possibleFormats}>
                  {(possibleFormat) => (
                    <option class="pl-2 text-sm" value={possibleFormat}>
                      {possibleFormat}
                    </option>
                  )}
                </For>
              </select>
            </div>
            <textarea
              spellcheck="false"
              ref={textarea}
              value={rawSchema()}
              class={` border-2 w-full flex-1 p-5 text-sm font-mono outline-none ${
                canRawSchemaParse() ? "border-white" : "border-red-500"
              }`}
              onInput={(e) =>
                updateSchemaAndData(
                  parsedSchema,
                  tryToParseSchema(e.target.value, format())
                )
              }
            ></textarea>
          </div>
          <div class="flex-1 h-1/2  flex flex-col overflow-hidden">
            <Show when={parsedSchema}>
              <CmsRenderer
                data={postData}
                schema={parsedSchema}
                setData={function () {
                  setPostData(...arguments);
                }}
                addPost={() => {
                  setPostData((data) => ({
                    ...data,
                    [Object.keys(data).length]:
                      getRestResponseFromSchema(parsedSchema),
                  }));
                }}
              />
            </Show>
          </div>
        </div>

        <div class="w-1/4 flex-0 text-neutral-600 flex flex-col  text-xs">
          <DataRenderer label="data" data={postData} />

          <Show when={trashbin.length > 0}>
            <TrashbinManager
              trashbin={trashbin}
              setTrashbin={setTrashbin}
              restoreFromTrashbin={restoreFromTrashbin}
              deleteFromTrashbin={deleteFromTrashbin}
            />
          </Show>
        </div>
        <div class="w-1/4 flex-0 text-neutral-600 flex flex-col  text-xs">
          <Show when={parsedSchema}>
            <DataRenderer
              label={"parsed schema"}
              data={parsedSchema}
              onUpdate={() => {
                updateSchemaAndData(
                  tryToParseSchema(rawSchema(), format()),
                  parsedSchema
                );
                prettify();
              }}
            />
          </Show>
          <Show when={false && defaultRestData()}>
            <DataRenderer label={"rest template"} data={defaultRestData()} />
          </Show>

          <Show when={trashbin.length > 0}>
            <DataRenderer label={"trashbin"} data={trashbin} />
          </Show>
        </div>
      </div>
    </div>
  );
}

export default App;
