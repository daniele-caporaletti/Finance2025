import { ApiResponse, Transaction, CreateTransactionPayload, UpdateTransactionPayload } from '../types';

const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbzn74VPLfnp9F1lyi8ndyCma7QOlRJ9DbaEO_wPJXOBMLhwzxMmg7N6-ZArseurqRjl/exec';

const postRequest = async (action: string, token: string, payload: object = {}) => {
   try {
    const response = await fetch(BASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, token, payload }),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Error with action '${action}': ${response.statusText}`);
    }
    
    const json: ApiResponse = await response.json();
    
    if (json.status !== 'ok') {
      throw new Error(json.message || `API returned invalid status for action '${action}'`);
    }

    return json.data;

  } catch (error) {
    console.error(`Failed during API action '${action}'`, error);
    throw error;
  }
}

export const fetchTransactions = async (token: string): Promise<Transaction[]> => {
  const data = await postRequest('list', token);
  return (data as Transaction[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createTransaction = async (payload: CreateTransactionPayload, token: string): Promise<void> => {
  await postRequest('create', token, payload);
};

export const updateTransaction = async (payload: UpdateTransactionPayload, token: string): Promise<void> => {
  await postRequest('update', token, payload);
};

export const deleteTransaction = async (id: number, token: string): Promise<void> => {
  await postRequest('delete', token, { id });
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