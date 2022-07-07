import jsxToJson from "simplified-jsx-to-json";
import ARRAY from "../lib/ARRAY";
import YAML from "yaml";
import diffArrays from "./diffArrays";
import capitalize from "./capitalize";
import fals from "fals";



const duplicateKeys = (array) => {
  let keys = array.map((el) => el.key);
  const set = new Set(keys);
  if (keys.length === set.size) return [];
  set.forEach((el) => {
    keys = ARRAY.removeElement(keys, el);
  });
  return [...new Set(keys)];
};


const parseJSX = (string) => {
  try {


    const walk = (layer) => {
      const response = {
        type: layer[0].toLowerCase(),
        ...layer[1],
      };
      const content = layer
        .slice(2, layer.length)
        .filter((el) => Array.isArray(el));
      if (content.length > 0) {
        response.content = content
          .map((el) => walk(el))
          .filter(el => !fals(el));
      } else if (response.type === 'repeater') {
        return false;
      }
      return response;
    };

    const firstPass = jsxToJson(string.replace(/[\r\n]/gm, ""));
    const secondPass = firstPass
      .filter((el) => Array.isArray(el))
      .map((element) => walk(element))
      .filter(el => !fals(el))
    return secondPass;
  } catch (err) {
    console.error(err);
    return false;
  }
};


const stringifyJSX = (json) => {
  const walk = (data, offset) => {
    const pars = Object.entries(data)
      .filter(([key]) => key !== "content" && key !== "type")
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    const tagName = capitalize(data.type);
    if (data.content) {
      const content = data.content
        .map((c) => walk(c, offset + "  "))
        .join("\n");
      const string = `${offset}<${tagName} ${pars}>
${content}
${offset}</${tagName}>`;
      return string;
    } else {
      const string = `${offset}<${tagName} ${pars}/>`;
      return string;
    }
  };
  const string = json.map((el) => walk(el, "")).join("\n");
  return string;
};

const validate = (schema) => {
  try {
    const walk = (layer) => {
      if (layer.content) {
        const duplicates = duplicateKeys(layer.content);
        if (duplicates.length > 0) throw `found duplicate keys: ${duplicates}`;
        layer.content.forEach((node) => walk(node));
      }
    };
    const duplicates = duplicateKeys(schema);
    if (duplicates.length > 0)
      throw `found duplicate keys in root: ${duplicates}`;
    schema.forEach((node) => walk(node));
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};


const parse = (string, format) => {
  try {
    let schema;
    switch (format) {
      case "jsx":
        schema = parseJSX(string);
        break;
      case "json":
        schema = JSON.parse(`{"data": ${string}}`).data;
        break;
      case "yaml":
        schema = YAML.parse(string);
        break;
    }
    if (!schema || !validate(schema)) throw `invalid schema`;
    return schema;
  } catch (err) {
    return false;
  }
};

const stringify = (schema, format) => {
  try {
    switch (format) {
      case "jsx":
        return stringifyJSX(schema);
      case "json":
        return JSON.stringify(schema, null, 2);
      case "yaml":
        return YAML.stringify(schema);
    }
  } catch (err) {
    return false;
  }
};

const diff = (schema1, schema2) => {
  const diff = {
    deleted: [],
    created: [],
    updated: [],

    equals: true,
  };



  const walk = (keys, layer1, layer2) => {
    // happens when a node is created
    if (!layer1) return;

    if (!layer2) {
      // happens when a node is deleted
      console.error("node2 is undefined?", keys, layer1);
      diff.deleted.push({ schema: layer1, keys });
      return;
    }
    if (Array.isArray(layer1)) {
      if (!Array.isArray(layer2)) {
        console.error("node 1 is an array, but not node 2");
        // TODO: what is the appropriate action here?
      }

      // diff the keys of the two layer nodes
      const { deleted, created, shared } = diffArrays(
        layer1.map((el) => el.key),
        layer2.map((el) => el.key)
      );




      shared.forEach((key) => {
        const node1 = layer1.find((el) => el.key === key);
        const node2 = layer2.find((el) => el.key === key);

        if (node1.type !== node2.type) {
          // when type changes add to updated
          diff.updated.push({
            keys: keys,
            type: "type",
            from: node1,
            to: node2,
            schema: node2,
          });
        }
        // walk deeper into the nodes
        walk([...keys, key], node1, node2);
      });

      if (deleted.length === 1 && created.length === 1) {
        // when simultaneously 1 key gets deleted and another appears
        // we assume this is in fact a node's key being updated

        // TODO:  should a node that is being ctrl+v'd on top of another node be considered an update?

        diff.updated.push({
          keys,
          type: "key",
          from: deleted[0],
          to: created[0],
        });
      } else {
        // else push the deleted and created keys to the resulting dif-object
        deleted.forEach((key) => {
          const schema = layer1.find((el) => el.key === key);

          diff.deleted.push({ keys: [...keys, key], schema });
        });



        created.forEach((key) => {
          let schema = layer2.find((el) => el.key === key);
          if (!schema)
            schema = layer1.find((el) => el.key === key);

          diff.created.push({ keys: [...keys, key], schema });
        });
      }
    } else if (layer1.content) {
      // walk the layer's children
      walk(keys, layer1.content, layer2.content);
    }
  };
  if (schema2) {
    walk([], schema1, schema2);
  }

  return {
    ...diff,
    equals:
      diff.deleted.length === 0 &&
      diff.created.length === 0 &&
      diff.updated.length === 0,
  };
};

const getSchemaPathFromDataPath = (path) => {
  try {
    const layer = parsedSchema;

    let success = true;
    const schemaPath = path.map((key) => {
      if (key === "[]") {
        layer = layer.content;
        return "content";
      }
      const layerIndex = layer.findIndex((node) => node.key === key);
      layer = layer[layerIndex];
      if (layer === -1) success = false;
      else return layerIndex;
    });
    return success ? [schemaPath, layer] : [false];
  } catch (err) {
    console.error("error", err);
    return [false];
  }
};

export default {
  parse, diff, stringify, getSchemaPathFromDataPath
}