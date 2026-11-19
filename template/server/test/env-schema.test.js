const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const serverRoot = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.resolve(serverRoot, 'env.schema.json'), 'utf8'));

const collectJsFiles = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const target = path.resolve(dir, item.name);
    if (item.isDirectory()) {
      return ['node_modules', 'test'].includes(item.name) ? [] : collectJsFiles(target);
    }
    return item.name.endsWith('.js') ? [target] : [];
  });

// @fastify/env 7 只把 schema 中声明的变量放进 fastify.config，读了未声明的变量只会得到 undefined
const collectConfigKeys = source => {
  const keys = new Set();
  for (const match of source.matchAll(/fastify\.config\.([A-Z][A-Z0-9_]*)/g)) {
    keys.add(match[1]);
  }
  for (const match of source.matchAll(/const\s*\{([^}]+)\}\s*=\s*fastify\.config/g)) {
    match[1].split(',').forEach(name => {
      const key = name.split(':')[0].trim();
      if (key) {
        keys.add(key);
      }
    });
  }
  return keys;
};

describe('env.schema.json', () => {
  it('服务端代码读取的 fastify.config 变量都已在 schema 中声明', () => {
    const declared = Object.keys(schema.properties);
    const missing = [];
    for (const file of collectJsFiles(serverRoot)) {
      for (const key of collectConfigKeys(fs.readFileSync(file, 'utf8'))) {
        if (!declared.includes(key)) {
          missing.push(`${path.relative(serverRoot, file)}: ${key}`);
        }
      }
    }
    expect(missing, `未在 env.schema.json 声明：\n${missing.join('\n')}`).to.deep.equal([]);
  });

  it('ENV 默认值为 prod', () => {
    expect(schema.properties.ENV.default).to.equal('prod');
  });
});
