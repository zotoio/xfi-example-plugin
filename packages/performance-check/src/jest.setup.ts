beforeAll(() => {
  jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
    console.log(`process.exit(${code}) called but ignored in tests`);
    return undefined as never;
  });
});

afterAll(() => {
  (process.exit as unknown as jest.Mock).mockRestore();
});
