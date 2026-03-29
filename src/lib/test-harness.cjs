const Module = require("node:module");

let tsNodeRegistered = false;

function registerTsNode(options) {
  if (tsNodeRegistered) {
    return;
  }

  if (options) {
    require("ts-node").register(options);
  } else {
    require("ts-node/register");
  }

  tsNodeRegistered = true;
}

function withMockedModuleLoad(mocks, run) {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      const value = mocks[request];
      return typeof value === "function" ? value(request, parent, isMain) : value;
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return run();
  } finally {
    Module._load = originalLoad;
  }
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

async function withSuppressedConsole(methods, run) {
  const originals = new Map();

  for (const method of methods) {
    originals.set(method, console[method]);
    console[method] = () => {};
  }

  try {
    return await run();
  } finally {
    for (const [method, original] of originals.entries()) {
      console[method] = original;
    }
  }
}

module.exports = {
  registerTsNode,
  withMockedModuleLoad,
  withSuppressedConsoleError,
  withSuppressedConsole,
};
