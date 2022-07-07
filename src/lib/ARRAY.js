// collection of pure array-manipulations
const insert = (arr, index, el) => [...arr.slice(0, index), el, ...arr.slice(index)]
const insertAfterElement = (arr, el, other_el) =>
  insert(arr, arr.indexOf(other_el), el)
const remove = (arr, index) => {
  if (parseInt(index) !== index || index < 0) return arr
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}
const removeElement = (arr, el) => {
  const i = arr.indexOf(el);
  return i === -1 ? arr : remove(arr, i)
}
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}
const concat = (array1, array2) => array1.concat(array2)
const push = (arr, el) => concat(arr, el);
const create = (size, value) => new Array(size).fill("").map((el, index) => {
  if (typeof value === 'function') {
    return value(index)
  } else {
    return value;
  }
})

export default {
  insert,
  insertAfterElement,
  remove,
  removeElement,
  shuffle,
  concat,
  push,
  create
}
