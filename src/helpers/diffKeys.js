import diffArrays from "./diffArrays";

export default function diffKeys(object1, object2) {
  let keys1 = Object.keys(object1 ? object1 : {});
  let keys2 = Object.keys(object2 ? object2 : {});
  return diffArrays(keys1, keys2);
}