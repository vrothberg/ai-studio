/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PodmanDesktopApi } from '../../../types/podman-desktop-api';
import type { Webview } from '@podman-desktop/api';

export interface IMessage {
  id: number;
  channel: string;
}

export interface IMessageRequest extends IMessage {
  args: unknown[];
}

export interface IMessageResponse extends IMessageRequest {
  status: 'error' | 'success';
  error?: string;
  body: unknown;
}

export function isMessageRequest(content: unknown): content is IMessageRequest {
  return (
    content !== undefined && content !== null && typeof content === 'object' && 'id' in content && 'channel' in content
  );
}

export function isMessageResponse(content: unknown): content is IMessageResponse {
  return isMessageRequest(content) && 'status' in content;
}

export class RpcExtension {
  methods: Map<string, (...args: unknown[]) => Promise<unknown>> = new Map();

  constructor(private webview: Webview) {
    this.init();
  }

  init() {
    this.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!isMessageRequest(message)) {
        console.error('Received incompatible message.', message);
        return;
      }

      if (!this.methods.has(message.channel)) {
        console.error(
          `Trying to call on an unknown channel ${message.channel}. Available: ${Array.from(this.methods.keys())}`,
        );
        throw new Error('channel does not exist.');
      }

      try {
        const result = await this.methods.get(message.channel)?.(...message.args);
        this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: result,
          status: 'success',
        } as IMessageResponse);
      } catch (e) {
        this.webview.postMessage({
          id: message.id,
          channel: message.channel,
          body: undefined,
          error: `Something went wrong on channel ${message.channel}: ${String(e)}`,
        } as IMessageResponse);
      }
    });
  }

  registerInstance<T>(classType: { new (...args: any[]): T }, instance: T) {
    const methodNames = Object.getOwnPropertyNames(classType.prototype).filter(
      name => name !== 'constructor' && typeof instance[name as keyof T] === 'function',
    );

    methodNames.forEach(name => {
      const method = (instance[name as keyof T] as any).bind(instance);
      this.register(name, method);
    });
  }

  register(channel: string, method: (body: any) => Promise<any>) {
    this.methods.set(channel, method);
  }
}

export class RpcBrowser {
  counter: number = 0;
  promises: Map<number, { resolve: (value: unknown) => unknown; reject: (value: unknown) => void }> = new Map();

  getUniqueId(): number {
    return ++this.counter;
  }

  constructor(
    private window: Window,
    private api: PodmanDesktopApi,
  ) {
    this.init();
  }

  init() {
    this.window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;
      if (!isMessageResponse(message)) {
        console.error('Received incompatible message.', message);
        return;
      }

      if (!this.promises.has(message.id)) {
        console.error('Unknown message id.');
        return;
      }

      const { resolve, reject } = this.promises.get(message.id) || {};

      if (message.status === 'error') {
        reject?.(message.error);
      } else {
        resolve?.(message.body);
      }
      this.promises.delete(message.id);
    });
  }

  getProxy<T>(): T {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisRef = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proxyHandler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          return (...args: unknown[]) => {
            const channel = prop.toString();
            return thisRef.invoke(channel, ...args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    };

    return new Proxy({}, proxyHandler) as T;
  }

  async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    // Generate a unique id for the request
    const requestId = this.getUniqueId();

    // Post the message
    this.api.postMessage({
      id: requestId,
      channel: channel,
      args: args,
    } as IMessageRequest);

    // Add some timeout
    setTimeout(() => {
      const { reject } = this.promises.get(requestId) || {};
      if (!reject) return;
      reject(new Error('Timeout'));
      this.promises.delete(requestId);
    }, 5000);

    // Create a Promise
    return new Promise((resolve, reject) => {
      this.promises.set(requestId, { resolve, reject });
    });
  }
}
