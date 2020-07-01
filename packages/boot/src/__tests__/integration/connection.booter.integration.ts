// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: @loopback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect, TestSandbox} from '@loopback/testlab';
import {TypeOrmBindings} from '@loopback/typeorm';
import {resolve} from 'path';
import {BooterApp} from '../fixtures/application';

describe('TypeORM connection booter integration tests', () => {
  const sandbox = new TestSandbox(resolve(__dirname, '../../.sandbox'));

  let app: BooterApp;

  beforeEach('reset sandbox', () => sandbox.reset());
  beforeEach(getApp);

  it('boots connections when app.boot() is called', async () => {
    const expectedBindings = [`${TypeOrmBindings.PREFIX}.SQLite`];
    await app.boot();
    const bindings = app.findByTag(TypeOrmBindings.TAG).map(b => b.key);
    expect(bindings.sort()).to.eql(expectedBindings.sort());
  });

  async function getApp() {
    await sandbox.copyFile(resolve(__dirname, '../fixtures/application.js'));
    await sandbox.copyFile(
      resolve(__dirname, '../fixtures/sqlite.connection.js'),
      'connections/sqlite.connection.js',
    );
    const MyApp = require(resolve(sandbox.path, 'application.js')).BooterApp;
    app = new MyApp();
  }
});
