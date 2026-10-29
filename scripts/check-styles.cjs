const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");

function declarations(filename) {
  const ast = babel.parseSync(
    fs.readFileSync(path.resolve(__dirname, "../src", filename), "utf8"),
    {
      configFile: false,
      babelrc: false,
      parserOpts: { plugins: ["jsx", "typescript"] },
    }
  );
  return ast.program.body.flatMap((node) => node.declarations || []);
}

const reset = declarations("styles/GlobalStyles.tsx").find(
  (node) => node.id.name === "BaseStyles"
).init.quasi.quasis[0].value.cooked;
assert.equal(
  crypto.createHash("sha256").update(reset).digest("hex"),
  "b319cc16e05c405f9aed4c93ce6a1aa4b87495152eee28f2ec639480f4cfd15d",
  "Preserve the original twin global reset"
);
const notice = declarations("root.component.tsx").find(
  (node) => node.id.name === "Notice"
).init.arguments[0];
assert.deepEqual(
  Object.fromEntries(
    notice.properties.map((node) => [
      node.key.name || node.key.value,
      node.value.value,
    ])
  ),
  {
    "--tw-text-opacity": "1",
    color: "rgb(21 128 61 / var(--tw-text-opacity, 1))",
  },
  "Preserve the original notice style and opacity semantics"
);
console.log("Original global reset and notice styles are unchanged.");
