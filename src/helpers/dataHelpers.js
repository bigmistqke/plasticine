import fals from "fals";

const getDataNodesFromKeys = (data, keys) => {
  keys = [...keys];
  const dataNodes = [];
  const walk = (layer, keys) => {
    const key = keys.shift();
    if (fals(key)) {


      dataNodes.push(layer);
      return;
    }
    layer = layer[key];


    if (Array.isArray(layer)) {
      layer.forEach((el, i) => {
        walk(layer, [i, ...keys]);
      });
    } else {
      walk(layer, keys);
    }
  };


  walk(data, keys);


  1
  return dataNodes;
};

const isDataNodeEmpty = (dataNode) => {
  let isEmpty = true;
  const walk = (layer) => {
    if (!isEmpty) return;

    if (Array.isArray(layer)) {
      layer.forEach((node) => walk(node));
    } else if (typeof layer === "object") {
      Object.values(layer).forEach((dataNode) => walk(dataNode));
    } else {
      if (layer !== "") {
        isEmpty = false;
      }
    }
  };
  walk(dataNode);
  return isEmpty;
};
export { getDataNodesFromKeys, isDataNodeEmpty }