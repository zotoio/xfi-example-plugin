import examplePlugin from './index';   
import { Almanac } from 'json-rules-engine';                                                                                  
import { jest } from '@jest/globals';                                                                                  
                                                                                                                        
 // Create a mock axios instance                                                                                        
import axios, { AxiosInstance } from 'axios';

const mockAxios = {
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnValue({})
} as jest.Mocked<typeof axios>;
 
 jest.mock('json-rules-engine');
                                                                                                                        
 // Mock the entire axios module                                                                                        
 jest.mock('axios', () => ({                                                                                            
   __esModule: true,                                                                                                    
   default: mockAxios,                                                                                                  
   create: () => mockAxios                                                                                              
 }));                                                                                                                   
                                                                                                                        
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
     const mockAlmanac = {
       factValue: jest.fn().mockResolvedValue({ data: {} }),
       addRuntimeFact: jest.fn(),
       addFact: jest.fn()
     } as jest.Mocked<Almanac>;                                                                           
                                                                                                                        
     beforeEach(() => {                                                                                                 
       mockAxios.get.mockClear();                                                                                       
       mockAxios.post.mockClear();  
                                                                                           
     });                                                                                                                
                                                                                                                        
     it('should handle successful API call', async () => {                                                              
       const mockResponse = { data: { status: 'success' } };                                                            
       mockAxios.post.mockResolvedValueOnce(mockResponse);                                                             
        mockAlmanac.factValue.mockResolvedValueOnce({                                                                       
          fileContent: 'version: "1.0.0"'                                                                              
        });
                                                                                                               
       const params = {                                                                                                 
         regex: 'version:\\s*["\']([^"\']+)["\']',                                                                      
         url: 'https://api.example.com/test',                                                                           
         method: 'POST',                                                                                                
         includeValue: true                                                                                             
       };                                                                                                               
                                                                                                                        
       const result = await fact.fn(params, mockAlmanac);                                                               
       expect(result.success).toBe(true);                                                                               
       expect(result.extractedValue).toBe('1.0.0');                                                                     
       expect(result.apiResponse).toEqual(mockResponse.data);                                                           
     });                                                                                                                
                                                                                                                        
     it('should handle regex match failure', async () => {                                                              
       const testAlmanac = {                                                                                            
         factValue: jest.fn().mockResolvedValue({                                                                       
           fileContent: 'no match here'                                                                                 
         }),
         addRuntimeFact: jest.fn(),
         addFact: jest.fn()                                                                                                             
       } as jest.Mocked<Almanac>;                                                                                                               
                                                                                                                        
       const result = await fact.fn({                                                                                   
         regex: 'version:\\s*["\']([^"\']+)["\']'                                                                       
       }, mockAlmanac);                                                                                                 
                                                                                                                        
       expect(result.success).toBe(false);                                                                              
       expect(result.reason).toBe('No match found');                                                                    
     });                                                                                                                
                                                                                                                        
     it('should handle API call failure', async () => {                                                                 
       mockAxios.post.mockRejectedValueOnce(new Error('API Error'));                                                    
                                                                                                                        
       const testAlmanac = {                                                                                            
         factValue: jest.fn().mockResolvedValue({                                                                       
           fileContent: 'version: "1.0.0"'                                                                              
         }),
         addRuntimeFact: jest.fn(),
         addFact: jest.fn()                                                                                                             
       } as jest.Mocked<Almanac>;                                                                                                               
                                                                                                                        
       const result = await fact.fn({                                                                                   
         regex: 'version:\\s*["\']([^"\']+)["\']',                                                                      
         url: 'https://api.example.com/test'                                                                            
       }, mockAlmanac);                                                                                                 
                                                                                                                        
       expect(result.success).toBe(false);                                                                              
       expect(result.error).toBe('API Error');                                                                          
     });                                                                                                                
   });                                                                                                                  
 }); 
