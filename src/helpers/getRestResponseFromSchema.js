import ARRAY from "../lib/ARRAY";
import { LoremIpsum } from "lorem-ipsum";
const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});


const getRestResponseFromSchema = (data) => {


  const walk = (data) => {
    if (data.type === "repeater") {
      /*  let content = Object.fromEntries(data.content.map((el) => walk(el)));
       content = ARRAY.create(10, () => ({ ...content })) */
      let content = ARRAY.create(1, () => Object.fromEntries(data.content.map((el) => walk(el))))
      return [
        data.key,
        content
      ];
    }
    if (data.type === "container") {
      if (!data.content) {
        return [data.key, []];
      }

      return [
        data.key,
        Object.fromEntries(data.content.map((el) => walk(el))),
      ];
    }
    return [data.key, data.defaultValue ? data.defaultValue : ""];
  };
  let response;
  try {
    if (Array.isArray(data))
      response = Object.fromEntries(data.map((el) => walk(el)));
    else
      response = walk(data)
  } catch (err) {
    console.error(err)
    return false;
  }

  return response;
};
export default getRestResponseFromSchema;
