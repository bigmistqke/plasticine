import { createEffect } from "solid-js";

export default function TrashbinManager(props) {
  return (
    <>
      <div class=" border-t-2 border-slate-200">
        <div class="p-2">
          <button
            class="w-full hover:border-slate-500 border-2 border-slate-200 rounded-md"
            onClick={() => props.setTrashbin([])}
          >
            empty trashbin
          </button>
        </div>
        <For each={props.trashbin}>
          {(item) => (
            <div class="w-full flex p-2 border-t-2 border-slate-100">
              <span class="flex-1 p-2">
                {[...item.keys, item.schema.key].join(" / ")}
              </span>
              <button
                class="pl-2 pr-2 border-2 border-slate-200 rounded-md hover:border-slate-500"
                onClick={() => props.restoreFromTrashbin(item)}
              >
                restore
              </button>
              <button
                class="pl-2 pr-2 border-2 border-slate-200 rounded-md hover:border-slate-500"
                onClick={() => props.deleteFromTrashbin(item)}
              >
                delete
              </button>
            </div>
          )}
        </For>
      </div>
    </>
  );
}
