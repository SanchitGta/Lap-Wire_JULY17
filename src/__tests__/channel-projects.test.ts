jest.mock('../../db', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  return { db };
});

import { getChannelProject, setChannelProject } from '../../channel-projects';

describe('channel-projects', () => {
  it('getChannelProject returns null on empty table', () => {
    expect(getChannelProject('C000')).toBeNull();
  });

  it('setChannelProject then getChannelProject returns the slug', () => {
    setChannelProject('C001', 'alpha', 'U001');
    expect(getChannelProject('C001')).toBe('alpha');
  });

  it('setChannelProject called twice on same channel returns the latest slug', () => {
    setChannelProject('C002', 'first', 'U002');
    setChannelProject('C002', 'second', 'U002');
    expect(getChannelProject('C002')).toBe('second');
  });

  it('getChannelProject for unmapped channel returns null when others are mapped', () => {
    setChannelProject('C003', 'some-project', 'U003');
    expect(getChannelProject('C999')).toBeNull();
  });
});
