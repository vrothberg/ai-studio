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

import '@testing-library/jest-dom/vitest';
import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import * as catalogStore from '/@/stores/catalog';
import type { Catalog } from '@shared/src/models/ICatalog';
import { readable } from 'svelte/store';
import type { EnvironmentCell } from '/@/pages/environments';
import ColumnModel from './ColumnModel.svelte';

vi.mock('/@/stores/catalog', async () => {
  return {
    catalog: vi.fn(),
  };
});

const initialCatalog: Catalog = {
  categories: [],
  models: [
    {
      id: 'model1',
      name: 'Model 1',
      description: '',
      hw: '',
      registry: '',
      license: '',
      url: '',
    },
    {
      id: 'model2',
      name: 'Model 2',
      description: '',
      hw: '',
      registry: '',
      license: '',
      url: '',
    },
  ],
  recipes: [],
};

test('display model name', async () => {
  const obj = {
    modelId: 'model1',
  } as unknown as EnvironmentCell;
  vi.mocked(catalogStore).catalog = readable<Catalog>(initialCatalog);
  render(ColumnModel, { object: obj });

  const text = screen.getByText('Model 1');
  expect(text).toBeInTheDocument();
});

test('display model port', async () => {
  const obj = {
    modelId: 'model1',
    modelPorts: [8080],
  } as unknown as EnvironmentCell;
  vi.mocked(catalogStore).catalog = readable<Catalog>(initialCatalog);
  render(ColumnModel, { object: obj });

  const text = screen.getByText('Model 1');
  expect(text).toBeInTheDocument();
  const ports = screen.getByText('PORT 8080');
  expect(ports).toBeInTheDocument();
});

test('display multpile model ports', async () => {
  const obj = {
    modelId: 'model1',
    modelPorts: [8080, 5000],
  } as unknown as EnvironmentCell;
  vi.mocked(catalogStore).catalog = readable<Catalog>(initialCatalog);
  render(ColumnModel, { object: obj });

  const text = screen.getByText('Model 1');
  expect(text).toBeInTheDocument();
  const ports = screen.getByText('PORTS 8080, 5000');
  expect(ports).toBeInTheDocument();
});
