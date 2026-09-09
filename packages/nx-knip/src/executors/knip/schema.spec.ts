import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("nx-knip executor schema", () => {
  it("offers deterministic Node and Bun runtime options with Node as the default", () => {
    const schema = JSON.parse(readFileSync(join(__dirname, "schema.json"), "utf8")) as {
      properties: {
        runtime?: { type?: string; enum?: string[]; default?: string }
      }
    }

    expect(schema.properties.runtime).toEqual({
      type: "string",
      description: expect.any(String),
      enum: ["node", "bun"],
      default: "node",
    })
  })
})
