import { ApiResponse, Transaction, CreateTransactionPayload, UpdateTransactionPayload } from '../types';

// Updated BASE_API_URL as per user request
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbzn74VPLfnp9F1lyi8ndyCma7QOlRJ9DbaEO_wPJXOBMLhwzxMmg7N6-ZArseurqRjl/exec';

// NOTE: We use 'text/plain' to avoid the browser sending an OPTIONS preflight request (CORS).
// Google Apps Script parses the body regardless of the content-type header.
const createHeaders = () => ({
  'Content-Type': 'text/plain;charset=utf-8',
});

export const fetchTransactions = async (accessToken: string): Promise<Transaction[]> => {
  try {
    // Token is passed ONLY in the URL to avoid complex headers
    const url = `${BASE_API_URL}?action=list&token=${encodeURIComponent(accessToken)}`;
    
    // GET requests without custom headers are "Simple Requests" and don't trigger preflight issues
    const response = await fetch(url, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    
    const json: ApiResponse = await response.json();
    if (json.status !== 'ok') {
      throw new Error(json.message || 'API returned invalid status');
    }
    
    return json.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Failed to load transactions", error);
    throw error;
  }
};

export const fetchExchangeRate = async (date: string, fromCurr: string): Promise<number> => {
  // This function is external and does not need changes
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
  } catch (error) {
    console.error("Failed to fetch exchange rate", error);
    throw error;
  }
};

export const createTransaction = async (payload: CreateTransactionPayload, accessToken: string): Promise<void> => {
  try {
    const url = `${BASE_API_URL}?action=create&token=${encodeURIComponent(accessToken)}`;
    
    // We send JSON stringified body but with text/plain header.
    // This prevents the browser from sending an OPTIONS request (CORS Preflight) which GAS often fails to handle.
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error creating transaction: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error(json.message || 'API returned invalid status for creation');
    }
  } catch (error) {
    console.error("Failed to create transaction", error);
    throw error;
  }
};

export const updateTransaction = async (payload: UpdateTransactionPayload, accessToken: string): Promise<void> => {
  try {
    const url = `${BASE_API_URL}?action=update&token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error updating transaction: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error(json.message || 'API returned invalid status for update');
    }
  } catch (error) {
    console.error("Failed to update transaction", error);
    throw error;
  }
};

export const deleteTransaction = async (id: number, accessToken: string): Promise<void> => {
  try {
    const url = `${BASE_API_URL}?action=delete&id=${id}&token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error deleting transaction: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error(json.message || 'API returned invalid status for deletion');
    }
  } catch (error) {
    console.error("Failed to delete transaction", error);
    throw error;
  }
};