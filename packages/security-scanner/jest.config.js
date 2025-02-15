 /** @type {import('ts-jest').JestConfigWithTsJest} */                                                           
 module.exports = {                                                                                              
  preset: 'ts-jest',                                                                                            
  testEnvironment: 'node',                                                                                      
  setupFilesAfterEnv: ['./src/jest.setup.ts'],                                                                  
  transform: {                                                                                                  
    '^.+\\.tsx?$': ['ts-jest', {                                                                                
      tsconfig: './tsconfig.json'                                                                               
    }]                                                                                                          
  }                                                                                                             
}; 