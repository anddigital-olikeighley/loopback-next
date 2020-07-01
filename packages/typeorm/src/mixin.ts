// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/typeorm
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Application,
  BindingScope,
  inject,
  lifeCycleObserver,
  LifeCycleObserver,
  MixinTarget,
} from '@loopback/core';
import debugFactory from 'debug';
import {ConnectionManager, ConnectionOptions} from 'typeorm';
import {TypeOrmBindings} from './keys';

const debug = debugFactory('loopback:typeorm:mixin');

export function TypeOrmMixin<T extends MixinTarget<Application>>(
  superClass: T,
) {
  return class extends superClass {
    connectionManager: ConnectionManager;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this.lifeCycleObserver(TypeOrmLifeCycleManager);
      this.connectionManager = new ConnectionManager();
      const binding = this.bind(TypeOrmBindings.MANAGER).to(
        this.connectionManager,
      );
      debug('Binding created for connection manager', binding);
    }

    async connection(connectionConfig: ConnectionOptions) {
      const connection = await this.connectionManager.create(connectionConfig);
      const name = connection.name;
      const binding = await this.bind(`${TypeOrmBindings.PREFIX}.${name}`)
        .toDynamicValue(() => this.connectionManager.get(name))
        .tag(TypeOrmBindings.TAG);
      this.add(binding);
      return binding;
    }

    async migrateSchema(): Promise<void> {
      // TODO: implement using TypeORM
      throw new Error('TypeORM migration not implemented.');
    }
  };
}

export interface ApplicationUsingTypeOrm extends Application {
  connection(options: ConnectionOptions): void;
  migrateSchema(): Promise<void>;
}

@lifeCycleObserver('datasource', {
  scope: BindingScope.SINGLETON,
})
export class TypeOrmLifeCycleManager implements LifeCycleObserver {
  constructor(
    @inject(TypeOrmBindings.MANAGER)
    private manager: ConnectionManager,
  ) {}

  async start(): Promise<void> {
    await Promise.all(this.manager.connections.map(c => c.connect()));
  }

  async stop(): Promise<void> {
    await Promise.all(this.manager.connections.map(c => c.close()));
  }
}