const db = require('../../db');

describe('Oracle DB Connection', () => {
  test('execute() retourne des résultats', async () => {
    const result = await db.execute(
      'SELECT 1 as TEST_VALUE FROM DUAL'
    );
    expect(result).toEqual([{ TEST_VALUE: 1 }]);
  });

  test('transaction() commit les changements', async () => {
    const testTable = `TEST_${Date.now()}`;
    
    await db.transaction(async (conn) => {
      await conn.execute(
        `CREATE TABLE ${testTable} (id NUMBER)`
      );
    });

    const exists = await db.execute(
      `SELECT table_name FROM user_tables 
       WHERE table_name = '${testTable}'`
    );
    
    expect(exists.length).toBe(1);
    await db.execute(`DROP TABLE ${testTable}`);
  });
});