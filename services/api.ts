import { ApiResponse, Transaction, CreateTransactionPayload, UpdateTransactionPayload } from '../types';

const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbycBqIfLZ5fNO9MBuw9NawYXsgMqU0NwStPS9FEFM9YJgrUUyT_k39gCnwsOuyejxRe/exec';

const handleResponse = async (response: Response, action: string) => {
    if (!response.ok) {
      throw new Error(`Error with action '${action}': ${response.statusText}`);
    }
    
    const json: ApiResponse = await response.json();
    
    if (json.status !== 'ok') {
      throw new Error(json.message || `API returned invalid status for action '${action}'`);
    }

    return json.data;
};

export const fetchTransactions = async (apiKey: string): Promise<Transaction[]> => {
  // GET request for list, passing key in query param
  const url = `${BASE_API_URL}?action=list&key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(url, { 
      method: 'GET'
    });
    const data = await handleResponse(response, 'list');
    return (data as Transaction[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error(`Failed during API action 'list'`, error);
    throw error;
  }
};

export const createTransaction = async (payload: CreateTransactionPayload, apiKey: string): Promise<void> => {
  // POST request for create, passing key in query param, data in body with JSON header
  const url = `${BASE_API_URL}?action=create&key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    await handleResponse(response, 'create');
  } catch (error) {
    console.error(`Failed during API action 'create'`, error);
    throw error;
  }
};

export const updateTransaction = async (payload: UpdateTransactionPayload, apiKey: string): Promise<void> => {
  const url = `${BASE_API_URL}?action=update&key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    await handleResponse(response, 'update');
  } catch (error) {
    console.error(`Failed during API action 'update'`, error);
    throw error;
  }
};

export const deleteTransaction = async (id: number, apiKey: string): Promise<void> => {
  const url = `${BASE_API_URL}?action=delete&key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });
    await handleResponse(response, 'delete');
  } catch (error) {
    console.error(`Failed during API action 'delete'`, error);
    throw error;
  }
};

// This function is external and does not need changes
export const fetchExchangeRate = async (date: string, fromCurr: string): Promise<number> => {
  if (fromCurr === 'CHF') return 1;
  try {
    const today = new Date().toISOString().split('T')[0];
    const queryDate = date > today ? 'latest' : date;
    const response = await fetch(`https://api.frankfurter.dev/v1/${queryDate}?base=${fromCurr}&symbols=CHF`);
    if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.rates.CHF;
  } catch (error)
 {
    console.error("Failed to fetch exchange rate", error);
    throw error;
  }
};