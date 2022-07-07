const parseJSX2 = (string) => {
  let data = { data: undefined };

  const lexString = (string) => {
    const words = string.trim().split(/\s+/);
    const tokens = [];
    for (let word of words) {

      // is word a closing-tag
      if (word.slice(0, 2) === "</") {
        let tagName =
          word.slice(word.length - 1, word.length) === ">"
            ? word.slice(2, word.length - 1)
            : word.slice(2, word.length);
        tokens.push({ type: "tag_end_open", value: tagName });
      }
      // word is a tag_start
      else if (word.slice(0, 1) === "<") {
        let tagName = word.slice(1, word.length);
        tokens.push({ type: "tag_start_open", value: tagName });
      } else {
        // word is an attribute

        let tag_end_closer = word.slice(word.length - 2, word.length) === "/>";
        let tag_start_closer =
          !tag_end_closer && word.slice(word.length - 1, word.length) === ">";

        if (tag_end_closer) {
          word = word.slice(0, word.length - 2);
        } else if (tag_start_closer) {
          word = word.slice(0, word.length - 1);
        }
        if (word.includes("=")) {
          let [key, value] = word.split("=");
          // regex to remove outer quotes from string
          value = value.replace(/(^"|"$)/g, "");
          tokens.push({ type: "attribute", content: { key, value } });
        } else {
          tokens.push({
            type: "attribute",
            content: { key: word, value: true },
          });
        }
        if (tag_start_closer) {
          tokens.push({
            type: "tag_start_close",
          });
        } else if (tag_end_closer) {
          tokens.push({
            type: "tag_end_close",
          });
        }
      }
    }
    return tokens;
  };

  const parseTokens = (tokens) => { };


  const tokens = lexString(string);
  const json = parseTokens(tokens);

};
