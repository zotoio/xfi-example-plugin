import { jest } from '@jest/globals';
import { Almanac, Fact } from 'json-rules-engine';
import axios, { AxiosInstance } from 'axios';

// Setup axios mock
const mockAxios = jest.fn() as unknown as jest.Mocked<typeof axios>;
Object.assign(mockAxios, {
  get: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  post: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  create: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
    post: jest.fn().mockImplementation(() => Promise.resolve({ data: {} }))
  })),
  request: jest.fn().mockImplementation(() => Promise.resolve({ data: {} })),
  defaults: {},
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
});

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
  create: () => mockAxios
}));

jest.mock('json-rules-engine');

// Create mock Almanac factory
const createMockAlmanac = (factValue: Record<string, any> = { data: {} }) => {
  const factValueFn = jest.fn().mockImplementation(async () => factValue);
  const mock = {
    factValue: factValueFn,
    addRuntimeFact: jest.fn().mockReturnThis(),
    addFact: jest.fn().mockReturnThis()
  };
  return mock as unknown as jest.Mocked<Almanac>;
};

import examplePlugin from './index';
                                                                                                                        
 describe('examplePlugin', () => {                                                                                        
   beforeEach(() => {                                                                                                   
     jest.clearAllMocks();                                                                                              
   });                                                                                                                  
                                                                                                                        
   it('should have correct structure', () => {                                                                          
     expect(examplePlugin).toHaveProperty('name', 'xfi-example-plugin');                                                  
     expect(examplePlugin).toHaveProperty('version', '1.0.0');                                                            
     expect(examplePlugin.facts).toHaveLength(1);                                                                         
     expect(examplePlugin.operators).toHaveLength(1);                                                                     
     expect(Array.isArray(examplePlugin.sampleRules)).toBe(true);                                                   
   });                                                                                                                  

   describe('loadRulesFromDirectory', () => {
     it('should load rules from json files', () => {
       expect(examplePlugin.sampleRules.length).toBeGreaterThan(0);
       const rule = examplePlugin.sampleRules[0];
       expect(rule).toHaveProperty('name');
       expect(rule).toHaveProperty('conditions');
       expect(rule).toHaveProperty('event');
     });
   });
                                                                                                                        
   describe('regexExtract operator', () => {                                                                            
     const operator = examplePlugin.operators![0];                                                                        
                                                                                                                        
     it('should return false for invalid input', () => {                                                                
       expect(operator.fn(undefined, 'pattern')).toBe(false);                                                           
       expect(operator.fn({}, 'pattern')).toBe(false);                                                                  
       expect(operator.fn({ result: null }, 'pattern')).toBe(false);                                                    
     });                                                                                                                
                                                                                                                        
     it('should return true when matches are found', () => {                                                            
       expect(operator.fn({ result: ['match'] }, 'pattern')).toBe(true);                                                
     });                                                                                                                
   });                                                                                                                  
                                                                                                                        
   describe('externalApiCall fact', () => {                                                                             
     const fact = examplePlugin.facts![0];     
     const mockAlmanac = createMockAlmanac();
                                                                                                                        
     beforeEach(() => {                                                                                                 
       mockAxios.get.mockClear();                                                                                       
       mockAxios.post.mockClear();  
                                                                                           
     });                                                                                                                
                                                                                                                        
     it('should handle successful API call', async () => {                                                              
       const mockResponse = { data: { status: 'success' } };                                                            
       mockAxios.post.mockImplementationOnce(() => Promise.resolve(mockResponse));
       
       const testAlmanac = createMockAlmanac({
         fileData: {
           fileContent: 'version: "1.0.0"'
         }
       });
                                                                                                               
       const params = {                                                                                                 
         regex: 'version:\\s*["\']([^"\']+)["\']',                                                                      
         url: 'https://api.example.com/test',                                                                           
         method: 'POST',                                                                                                
         includeValue: true                                                                                             
       };                                                                                                               
                                                                                                                        
       const result = await fact.fn(params, testAlmanac);                                                               
       expect(result.success).toBe(true);                                                                               
       expect(result.extractedValue).toBe('1.0.0');                                                                     
       expect(result.apiResponse).toEqual(mockResponse.data);                                                           
     });                                                                                                                
                                                                                                                        
     it('should handle regex match failure', async () => {                                                              
       const testAlmanac = createMockAlmanac({
         fileData: {
           fileContent: 'no match here'
         }
       });
                                                                                                                        
       const result = await fact.fn({                                                                                   
         regex: 'version:\\s*["\']([^"\']+)["\']'                                                                       
       }, mockAlmanac);                                                                                                 
                                                                                                                        
       expect(result.success).toBe(false);                                                                              
       expect(result.reason).toBe('No match found');                                                                    
     });                                                                                                                
                                                                                                                        
     it('should handle API call failure', async () => {                                                                 
       mockAxios.post.mockImplementationOnce(() => Promise.reject(new Error('API Error')));                                                    
                                                                                                                        
       const testAlmanac = createMockAlmanac({
         fileData: {
           fileContent: 'version: "1.0.0"'
         }
       });
                                                                                                                        
       const result = await fact.fn({                                                                                   
         regex: 'version:\\s*["\']([^"\']+)["\']',                                                                      
         url: 'https://api.example.com/test',
         method: 'POST',
         includeValue: true                                                                            
       }, testAlmanac);                                                                                                 
                                                                                                                        
       expect(result.success).toBe(false);                                                                              
       expect(result.error).toBe('API Error');
       expect(result.timestamp).toBeDefined();                                                                          
     });                                                                                                                
   });                                                                                                                  
 }); 
