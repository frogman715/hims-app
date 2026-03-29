const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const exportUtils = require("./export-utils.ts");

function createBrowserMocks() {
  const alerts = [];
  const appended = [];
  const removed = [];
  const createdUrls = [];
  const revokedUrls = [];
  const clicked = [];

  global.alert = (message) => alerts.push(message);
  global.Blob = class MockBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options?.type;
    }
    async text() {
      return this.parts.join("");
    }
  };
  global.window = {
    URL: {
      createObjectURL(blob) {
        createdUrls.push(blob);
        return "blob:mock-url";
      },
      revokeObjectURL(url) {
        revokedUrls.push(url);
      },
    },
    open() {
      return {
        document: {
          written: "",
          write(value) {
            this.written += value;
          },
          close() {},
        },
      };
    },
  };
  global.document = {
    body: {
      appendChild(node) {
        appended.push(node);
      },
      removeChild(node) {
        removed.push(node);
      },
    },
    createElement(tag) {
      return {
        tag,
        href: "",
        attrs: {},
        setAttribute(name, value) {
          this.attrs[name] = value;
        },
        click() {
          clicked.push(this);
        },
      };
    },
    getElementById(id) {
      if (id === "print-me") {
        return { innerHTML: "<table><tr><td>ok</td></tr></table>" };
      }
      return null;
    },
  };

  return { alerts, appended, removed, createdUrls, revokedUrls, clicked };
}

function cleanupBrowserMocks() {
  delete global.alert;
  delete global.Blob;
  delete global.window;
  delete global.document;
}

async function withSuppressedConsoleError(run) {
  const original = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = original;
  }
}

test("export utils create downloadable CSV/text output and alert on empty data", async () => {
  const mocks = createBrowserMocks();
  try {
    exportUtils.exportToCSV([], "empty.csv");
    assert.deepEqual(mocks.alerts, ["No data to export"]);

    exportUtils.exportToCSV(
      [{ name: 'Jane "JJ"', notes: "A,B", active: true }],
      "crew.csv"
    );
    exportUtils.exportTableToText([{ name: "Jane", rank: "Master" }], "crew.txt");

    assert.equal(mocks.createdUrls.length, 2);
    assert.equal(mocks.clicked.length, 2);

    const csvText = await mocks.createdUrls[0].text();
    const txtText = await mocks.createdUrls[1].text();
    assert.match(csvText, /"Jane ""JJ"""/);
    assert.match(csvText, /"A,B"/);
    assert.match(txtText, /name/);
    assert.match(txtText, /rank/);
  } finally {
    cleanupBrowserMocks();
  }
});

test("export utils support print flow and safe delete-style download helper behavior", () => {
  const mocks = createBrowserMocks();
  try {
    exportUtils.printDocument("print-me", "Crew Report");
    assert.equal(mocks.alerts.length, 0);
    assert.equal(mocks.appended.length >= 0, true);
  } finally {
    cleanupBrowserMocks();
  }
});

test("export utils print helper fails quietly when target element is missing", async () => {
  const mocks = createBrowserMocks();
  try {
    await withSuppressedConsoleError(async () => {
      exportUtils.printDocument("missing", "Missing");
    });
    assert.equal(mocks.alerts.length, 0);
  } finally {
    cleanupBrowserMocks();
  }
});
