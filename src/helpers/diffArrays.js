import ARRAY from "../lib/ARRAY";



export default function diffArrays(array1, array2) {
  let shared = [];
  for (let i = array1.length - 1; i >= 0; i--) {
    let el = array1[i];
    let i2 = array2.indexOf(el);
    if (i2 !== -1) {
      shared.push(el)
      array1 = ARRAY.remove(array1, i);
      array2 = ARRAY.remove(array2, i2);
    }
  }
  return {
    deleted: array1,
    created: array2,
    shared,
    equals: array1.length === 0 && array2.length === 0,
  };
}