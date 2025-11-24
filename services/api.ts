import { ApiResponse, Transaction, CreateTransactionPayload, UpdateTransactionPayload } from '../types';

// Configuration
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbxnb60NH1-Q5kYW91EjSYaeUrRPk5kANhwVoSMnDHbUmVi1ACUdoUmgxQ-t692Gt2Kq/exec';

/**
 * Helper function to handle API responses.
 * Checks for HTTP errors and API-specific error statuses.
 */
const handleResponse = async (response: Response, action: string) => {
    if (!response.ok) {
      throw new Error(`HTTP Error on '${action}': ${response.statusText}`);
    }
    
    const json: ApiResponse = await response.json();
    
    if (json.status !== 'ok') {
      throw new Error(json.message || `API returned error for action '${action}'`);
    }

    return json.data;
};

/**
 * GET Transactions
 * Uses a standard GET request.
 * Authentication: API Key passed in URL query parameters.
 */
export const fetchTransactions = async (apiKey: string): Promise<Transaction[]> => {
  const url = `${BASE_API_URL}?action=list&key=${encodeURIComponent(apiKey)}`;
  
  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await handleResponse(response, 'list');
    
    // Sort by date descending (newest first)
    return (data as Transaction[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error(`API Error (list):`, error);
    throw error;
  }
};

/**
 * CREATE Transaction
 * Uses a POST request.
 * Strategy: "Simple Request" (No CORS Preflight).
 * We send the body as a stringified JSON but WITHOUT 'Content-Type: application/json'.
 * The browser sends it as 'text/plain', avoiding the OPTIONS request.
 * The Google Apps Script parses the text body as JSON.
 */
export const createTransaction = async (payload: CreateTransactionPayload, apiKey: string): Promise<void> => {
  const url = `${BASE_API_URL}?action=create&key=${encodeURIComponent(apiKey)}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      // No headers implies 'text/plain', skipping CORS preflight checks.
      body: JSON.stringify(payload)
    });
    await handleResponse(response, 'create');
  } catch (error) {
    console.error(`API Error (create):`, error);
    throw error;
  }
};

/**
 * UPDATE Transaction
 * Uses a POST request.
 * Strategy: "Simple Request" (Same as createTransaction).
 */
export const updateTransaction = async (payload: UpdateTransactionPayload, apiKey: string): Promise<void> => {
  const url = `${BASE_API_URL}?action=update&key=${encodeURIComponent(apiKey)}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    await handleResponse(response, 'update');
  } catch (error) {
    console.error(`API Error (update):`, error);
    throw error;
  }
};

/**
 * DELETE Transaction
 * Uses a POST request.
 * ID is passed in URL query parameters for simplicity.
 * Strategy: "Simple Request" (No body, no headers).
 */
export const deleteTransaction = async (id: number, apiKey: string): Promise<void> => {
  const url = `${BASE_API_URL}?action=delete&id=${id}&key=${encodeURIComponent(apiKey)}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST'
    });
    await handleResponse(response, 'delete');
  } catch (error) {
    console.error(`API Error (delete):`, error);
    throw error;
  }
};

/**
 * External API: Frankfurter
 * Used for currency conversion (EUR/USD/GBP -> CHF).
 */
export const fetchExchangeRate = async (date: string, fromCurr: string): Promise<number> => {
  if (fromCurr === 'CHF') return 1;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    // Use 'latest' if the transaction date is in the future, otherwise use specific date
    const queryDate = date > today ? 'latest' : date;
    
    const response = await fetch(`https://api.frankfurter.dev/v1/${queryDate}?base=${fromCurr}&symbols=CHF`);
    
    if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.rates.CHF;
  } catch (error) {
    console.error("Currency Conversion Error:", error);
    // Fallback: return 1 to allow saving even if conversion fails (user can edit later)
    return 1; 
  }
};