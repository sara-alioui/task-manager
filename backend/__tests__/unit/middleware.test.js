const { validateTask } = require('../../middlewares/validators');

describe('Middleware Validators', () => {
  test('validateTask() rejette les tâches sans titre', () => {
    const mockReq = { body: { due_date: '2023-01-01' } };
    const mockRes = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const mockNext = jest.fn();

    validateTask(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Le titre est requis"
    });
  });

  test('validateTask() accepte les tâches valides', () => {
    const mockReq = { 
      body: { title: "Tâche valide", user_id: 1 } 
    };
    const mockRes = {};
    const mockNext = jest.fn();

    validateTask(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});