/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { buildActiveMappings, diffMappings } from './build_active_mappings';
import { IndexMapping } from './call_cluster';

describe('buildActiveMappings', () => {
  test('combines all mappings and includes core mappings', () => {
    const properties = {
      aaa: { type: 'text' },
      bbb: { type: 'long' },
    };

    expect(buildActiveMappings({ properties })).toMatchSnapshot();
  });

  test('disallows duplicate mappings', () => {
    const properties = { type: { type: 'long' } };

    expect(() => buildActiveMappings({ properties })).toThrow(
      /Cannot redefine core mapping \"type\"/
    );
  });

  test('disallows mappings with leading underscore', () => {
    const properties = { _hm: 'You shall not pass!' };

    expect(() => buildActiveMappings({ properties })).toThrow(
      /Invalid mapping \"_hm\"\. Mappings cannot start with _/
    );
  });
});

describe('diffMappings', () => {
  test('is different if expected contains extra hashes', () => {
    const actual: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar', baz: 'qux' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };

    expect(diffMappings(actual, expected)!.changedProp).toEqual('doc.properties.baz');
  });

  test('does nothing if actual contains extra hashes', () => {
    const actual: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar', baz: 'qux' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };

    expect(diffMappings(actual, expected)).toBeUndefined();
  });

  test('does nothing if actual hashes are identical to expected, but properties differ', () => {
    const actual: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {
          foo: 'bar',
        },
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {
          foo: 'baz',
        },
      },
    };

    expect(diffMappings(actual, expected)).toBeUndefined();
  });

  test('is different if meta hashes change', () => {
    const actual: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'baz' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };

    expect(diffMappings(actual, expected)!.changedProp).toEqual('doc.properties.foo');
  });

  test('is different if dynamic is different', () => {
    const actual: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'abcde',
        properties: {},
      },
    };

    expect(diffMappings(actual, expected)!.changedProp).toEqual('doc.dynamic');
  });

  test('is different if migrationMappingHash is missing from actual', () => {
    const actual: IndexMapping = {
      doc: {
        _meta: {},
        dynamic: 'strict',
        properties: {},
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };

    expect(diffMappings(actual, expected)!.changedProp).toEqual('doc._meta');
  });

  test('is different if _meta is missing from actual', () => {
    const actual: IndexMapping = {
      doc: {
        dynamic: 'strict',
        properties: {},
      },
    };
    const expected: IndexMapping = {
      doc: {
        _meta: {
          migrationMappingHash: { foo: 'bar' },
        },
        dynamic: 'strict',
        properties: {},
      },
    };

    expect(diffMappings(actual, expected)!.changedProp).toEqual('doc._meta');
  });
});
